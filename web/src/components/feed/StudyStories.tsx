import { useEffect, useRef, useState, type ReactNode } from 'react';
import { httpsCallable } from 'firebase/functions';
import { createPortal } from 'react-dom';
import { collection, doc, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db, functions } from '../../firebase/config';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { formatDuration } from '../../utils/formatTime';
import { formatRelativeTime } from '../../utils/formatDate';
import { loadStoryPhoto, preparePhoto, reactToStory, removeStory, STORY_EMOJIS, uploadStory, type Story } from '../../services/storyService';
import type { GroupMember, UserProfile } from '../../types';
import './StudyStories.css';

type Member = GroupMember & { activeSessionId?: string | null; sessionStatus?: 'active' | 'paused' | null };
const statusText = (m: Member) => m.activeSessionId ? m.sessionStatus === 'paused' ? 'Sessão pausada ⏸️' : 'Estudando agora 🟢' : 'Parou de estudar ⚫';

function Dialog({ children, close, label, className = '' }: { children: ReactNode; close: () => void; label: string; className?: string }) {
  const element = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close); useEffect(() => { closeRef.current = close; }, [close]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; element.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (!element.current?.contains(document.activeElement)) return;
      if (e.key === 'Escape') { e.stopImmediatePropagation(); closeRef.current(); }
      if (e.key === 'Tab') {
        const focusable = Array.from(element.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]'));
        const index = focusable.indexOf(document.activeElement as HTMLElement);
        e.preventDefault(); focusable[(index + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return createPortal(<div className={`story-overlay ${className}`} ref={element} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} onClick={e => { if (e.target === e.currentTarget) close(); }}>{children}</div>, document.body);
}

function MemberDetails({ member, timezone, close, anchor }: { member: Member; timezone: string; close: () => void; anchor?: DOMRect }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [daily, setDaily] = useState<{ date: string; seconds: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const { showToast } = useToast();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => onSnapshot(doc(db, 'users', member.uid), s => setProfile(s.data() as UserProfile), () => showToast('Erro ao carregar perfil.', 'error')), [member.uid, showToast]);
  const seconds = daily?.date === date ? daily.seconds : null;
  useEffect(() => onSnapshot(doc(db, 'users', member.uid, 'dailyStudy', date), s => setDaily({ date, seconds: s.data()?.totalSeconds ?? 0 }), () => showToast('Erro ao carregar estudo de hoje.', 'error')), [member.uid, date, showToast]);
  const closeRef = useRef(close); useEffect(() => { closeRef.current = close; }, [close]);
  useEffect(() => { if (!anchor) return; const timer = setTimeout(() => closeRef.current(), 5000); return () => clearTimeout(timer); }, [anchor]);
  const style = anchor ? { position: 'fixed' as const, left: Math.max(12, Math.min(anchor.left, window.innerWidth - 300)), top: Math.max(12, Math.min(anchor.bottom + 8, window.innerHeight - 260)), width: 288 } : undefined;
  return <Dialog close={close} label={`Perfil de ${member.name}`} className="story-details-overlay"><section className="story-panel" style={style}>
    <button className="story-close" onClick={close} aria-label="Fechar perfil">×</button>
    <Avatar src={profile?.avatarUrl ?? member.avatarUrl} name={profile?.name ?? member.name} size="lg" />
    <h2>{profile?.name ?? member.name}</h2><p>@{profile?.nickname ?? member.nickname}</p>
    <strong>{statusText(member)}</strong>
    <p>{seconds === null ? 'Carregando tempo de hoje…' : `${formatDuration(seconds)} estudados hoje 📚`}</p>
    {!!profile?.currentStreak && <p>🔥 {profile.currentStreak} dias de sequência</p>}
    {!anchor && profile && <p>🎯 {profile.totalPoints} pontos · ⏱️ {formatDuration(profile.totalStudySeconds)} no total</p>}
  </section></Dialog>;
}

function StoryViewer({ story, member, uid, timezone, close }: { story: Story; member: Member; uid: string; timezone: string; close: () => void }) {
  const [photo, setPhoto] = useState(''); const [photoError, setPhotoError] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false); const [optimistic, setOptimistic] = useState<string | null | undefined>(undefined);
  const [removing, setRemoving] = useState(false);
  const touchY = useRef<number | null>(null); const { showToast } = useToast();
  useEffect(() => {
    let alive = true; let url = '';
    loadStoryPhoto(story).then(blob => { if (alive) { url = URL.createObjectURL(blob); setPhoto(url); } }).catch(() => { if (alive) setPhotoError(true); });
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [story]);
  useEffect(() => onSnapshot(collection(db, 'studyStories', story.id, 'reactions'), snap => {
    setReactions(Object.fromEntries(snap.docs.map(d => [d.id, d.data().emoji])));
  }, () => showToast('Erro ao atualizar reações.', 'error')), [story.id, showToast]);
  const selected = optimistic === undefined ? reactions[uid] : optimistic;
  const displayed = { ...reactions }; if (selected) displayed[uid] = selected; else delete displayed[uid];
  async function react(emoji: string) {
    if (pending || uid === story.userId) return;
    const next = selected === emoji ? null : emoji;
    setPending(true); setOptimistic(next);
    try { await reactToStory(story.id, next); setReactions(prev => { const updated = { ...prev }; if (next) updated[uid] = next; else delete updated[uid]; return updated; }); }
    catch { showToast('Não foi possível salvar sua reação. Tente novamente.', 'error'); }
    finally { setPending(false); setOptimistic(undefined); }
  }
  return <Dialog close={close} label={`Story de ${member.name}`} className="story-viewer">
    <header><button className="story-author" onClick={() => setProfileOpen(true)}><Avatar src={member.avatarUrl} name={member.name} /><span><b>{member.name}</b><small>@{member.nickname} · {formatRelativeTime(story.createdAt)}</small></span></button><button onClick={close} aria-label="Fechar story">×</button></header>
    <div className="story-status">{statusText(member)}</div>
    <div className="story-photo" onTouchStart={e => { touchY.current = e.touches[0].clientY; }} onTouchEnd={e => { if (touchY.current !== null && e.changedTouches[0].clientY - touchY.current > 90) close(); touchY.current = null; }}>
      {photo ? <img src={photo} alt={`Momento de estudo de ${member.name}`} /> : <p role="status">{photoError ? 'Não foi possível carregar a foto.' : 'Carregando foto…'}</p>}
    </div>
    <footer><div className="story-reactions" aria-label="Reações">{STORY_EMOJIS.map(emoji => <button key={emoji} aria-label={`Reagir com ${emoji}`} aria-pressed={selected === emoji} disabled={pending || uid === story.userId} onClick={() => react(emoji)}>{emoji}<small>{Object.values(displayed).filter(v => v === emoji).length}</small></button>)}</div>
      {uid === story.userId && <button disabled={removing} onClick={async () => { setRemoving(true); try { await removeStory(story.id); close(); } catch { showToast('Erro ao remover foto. Tente novamente.', 'error'); setRemoving(false); } }}>{removing ? 'Removendo…' : 'Remover minha foto'}</button>}
    </footer>
    {profileOpen && <MemberDetails member={member} timezone={timezone} close={() => setProfileOpen(false)} />}
  </Dialog>;
}

function PhotoComposer({ close }: { close: () => void }) {
  const [blob, setBlob] = useState<Blob | null>(null); const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false); const { showToast } = useToast();
  const camera = useRef<HTMLInputElement>(null); const gallery = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function choose(file?: File) { if (!file) return; setBusy(true); try { const prepared = await preparePhoto(file); setBlob(prepared); setPreview(URL.createObjectURL(prepared)); } catch (error) { showToast(error instanceof Error ? error.message : 'Formato de imagem não suportado.', 'error'); } finally { setBusy(false); } }
  return <Dialog close={() => { if (!busy) close(); }} label="Postar foto de estudo"><section className="story-panel story-composer">
    <h2>Seu momento de estudo 📚</h2><p>Uma foto por vez, até a meia-noite do grupo.</p>
    <input hidden ref={camera} type="file" accept="image/*" capture="environment" onChange={e => { void choose(e.target.files?.[0]); e.target.value = ''; }} />
    <input hidden ref={gallery} type="file" accept="image/*" onChange={e => { void choose(e.target.files?.[0]); e.target.value = ''; }} />
    {preview && <img src={preview} alt="Prévia da foto a publicar" />}
    <div className="story-actions"><button disabled={busy} onClick={() => camera.current?.click()}>📷 Câmera</button><button disabled={busy} onClick={() => gallery.current?.click()}>🖼️ Galeria</button></div>
    <div className="story-actions"><button disabled={busy} onClick={close}>Cancelar</button><button disabled={!blob || busy} onClick={async () => { if (!blob) return; setBusy(true); try { await uploadStory(blob); showToast('Foto publicada!', 'success'); close(); } catch (error) { showToast(error instanceof Error ? error.message : 'Erro ao publicar foto. Tente novamente.', 'error'); } finally { setBusy(false); } }}>{busy ? 'Preparando…' : 'Confirmar foto'}</button></div>
  </section></Dialog>;
}

export function StudyStories({ groupId, uid }: { groupId: string; uid: string }) {
  const [members, setMembers] = useState<Member[]>([]); const [stories, setStories] = useState<Story[]>([]);
  const [timezone, setTimezone] = useState('America/Sao_Paulo'); const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<{ uid: string; anchor: DOMRect; storyId?: string } | null>(null);
  const [composing, setComposing] = useState(false); const { showToast } = useToast();
  useEffect(() => {
    const fail = () => showToast('Não foi possível atualizar os stories do grupo.', 'error');
    void httpsCallable(functions, 'initialize_story_presence')({}).catch(fail);
    const stops = [onSnapshot(collection(db, 'groups', groupId, 'members'), s => setMembers(s.docs.map(d => ({ ...d.data(), uid: d.id }) as Member)), fail),
      onSnapshot(query(collection(db, 'studyStories'), where('groupId', '==', groupId), where('published', '==', true), where('expiresAt', '>', Timestamp.now())), s => setStories(s.docs.map(d => ({ ...d.data(), id: d.id }) as Story)), fail),
      onSnapshot(doc(db, 'groups', groupId), s => setTimezone(s.data()?.timezone || 'America/Sao_Paulo'), fail)];
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const wake = () => setNow(Date.now()); window.addEventListener('focus', wake); document.addEventListener('visibilitychange', wake);
    return () => { stops.forEach(stop => stop()); clearInterval(timer); window.removeEventListener('focus', wake); document.removeEventListener('visibilitychange', wake); };
  }, [groupId, showToast]);
  // Prefer the newest generation while older restored data is reconciled by publication.
  const photos = new Map(stories.filter(s => s.published && s.expiresAt.toMillis() > now)
    .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis() || a.id.localeCompare(b.id))
    .map(s => [s.userId, s]));
  const rank = (m: Member) => m.uid === uid ? -1 : m.activeSessionId ? m.sessionStatus === 'paused' ? 1 : 0 : 2;
  const visible = members.filter(m => m.activeSessionId || photos.has(m.uid)).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name) || a.uid.localeCompare(b.uid));
  const current = visible.find(m => m.uid === selected?.uid); const story = current && photos.get(current.uid);
  const self = members.find(m => m.uid === uid);
  return <>{visible.length > 0 && <section className="study-stories" aria-label="Quem está estudando"><div className="story-strip">{visible.map(member => <div className="story-item" key={member.uid}>
    <button className={`story-ring ${member.activeSessionId ? member.sessionStatus === 'paused' ? 'paused' : 'active' : 'stopped'}`} aria-label={`${member.uid === uid ? 'Você' : member.name}: ${statusText(member)}${photos.has(member.uid) ? ', com foto' : ''}`} onClick={e => setSelected({ uid: member.uid, storyId: photos.get(member.uid)?.id, anchor: e.currentTarget.getBoundingClientRect() })}><Avatar src={member.avatarUrl} name={member.name} size="lg" />{photos.has(member.uid) && <span className="story-camera">📷</span>}</button>
    {member.uid === uid && member.activeSessionId && <button className="story-add" aria-label="Adicionar foto de estudo" onClick={() => setComposing(true)}>+</button>}
    <span className="story-name">{member.uid === uid ? 'Você' : member.name?.split(' ')[0] || `@${member.nickname}`}</span>
  </div>)}</div></section>}
    {current && selected && (!selected.storyId || story?.id === selected.storyId) && (story ? <StoryViewer key={story.id} story={story} member={current} uid={uid} timezone={timezone} close={() => setSelected(null)} /> : <MemberDetails key={current.uid} member={current} timezone={timezone} anchor={selected.anchor} close={() => setSelected(null)} />)}
    {composing && self?.activeSessionId && <PhotoComposer close={() => setComposing(false)} />}
  </>;
}
