import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getSubjectSetup, requestSubject, saveSubjectSetup, type SubjectSetup } from '../services/subjectService';
import { subjectColor } from '../utils/subjectColor';

type View = 'catalog' | 'colors' | 'palette' | 'list';
const palette = ['#d77af5', '#f57380', '#ffa64d', '#ffd84f', '#6dca7b', '#54c9c3', '#70b8ff', '#6688f5', '#f27bbb', '#ad98e8', '#777d89'];
const card = 'rounded-xl border border-border bg-bg-secondary p-4';
const primaryButton = 'w-full rounded-xl bg-accent-primary px-4 py-3 font-semibold text-white disabled:opacity-50';

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function SubjectsPage() {
  const [setup, setSetup] = useState<SubjectSetup | null>(null);
  const [view, setView] = useState<View>('catalog');
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [draftColors, setDraftColors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [paletteId, setPaletteId] = useState<string | null>(null);
  const [paletteColor, setPaletteColor] = useState('');
  const [paletteReturn, setPaletteReturn] = useState<'colors' | 'list'>('colors');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    getSubjectSetup().then(data => {
      if (!active) return;
      setSetup(data);
      setDraftIds(data.preferredSubjectIds);
      setDraftColors(data.subjectColors);
      setView(data.preferredSubjectIds.length ? 'list' : 'catalog');
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Erro ao carregar matérias.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (view === 'palette') setView(paletteReturn);
      else setMenuId(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, paletteReturn]);

  const selected = useMemo(() => setup?.subjects.filter(subject => draftIds.includes(subject.id)) || [], [setup, draftIds]);
  const results = useMemo(() => setup?.subjects.filter(subject => normalize(subject.name).includes(normalize(query.trim()))) || [], [setup, query]);
  const visible = query.trim() || showAll ? results : results.slice(0, 3);
  const paletteSubject = setup?.subjects.find(subject => subject.id === paletteId);

  function toggle(id: string) {
    setDraftIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);
    setError(''); setNotice('');
  }

  function openPalette(id: string, origin: 'colors' | 'list') {
    setPaletteId(id);
    setPaletteColor(subjectColor(id, draftColors));
    setPaletteReturn(origin);
    setMenuId(null);
    setView('palette');
    setError(''); setNotice('');
  }

  async function save(ids: string[], colors: Record<string, string>, message: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      const chosenColors = Object.fromEntries(ids.filter(id => colors[id]).map(id => [id, colors[id]]));
      const saved = await saveSubjectSetup(ids, chosenColors);
      setSetup(current => current ? { ...current, preferredSubjectIds: saved.preferredSubjectIds, subjectColors: saved.subjectColors } : current);
      setDraftIds(saved.preferredSubjectIds);
      setDraftColors(saved.subjectColors);
      setView(saved.preferredSubjectIds.length ? 'list' : 'catalog');
      setNotice(message);
      setMenuId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar suas matérias.');
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    await save(draftIds.filter(item => item !== id), draftColors, 'Matéria removida da sua lista.');
  }

  async function submitSuggestion(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await requestSubject(name);
      setSetup(await getSubjectSetup());
      setName('');
      setNotice('Sugestão enviada ao administrador.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível enviar a sugestão.'); }
    finally { setBusy(false); }
  }

  function back() {
    setError(''); setNotice('');
    if (view === 'palette') setView(paletteReturn);
    else if (view === 'colors') setView('catalog');
    else if (view === 'catalog' && setup?.preferredSubjectIds.length) {
      setDraftIds(setup.preferredSubjectIds);
      setDraftColors(setup.subjectColors);
      setView('list');
    }
  }

  const studyLink = view === 'list' || (view === 'catalog' && !setup?.preferredSubjectIds.length);
  const colorOptions = paletteColor && !palette.includes(paletteColor) ? [paletteColor, ...palette] : palette;
  return <div className="mx-auto w-full max-w-2xl space-y-5 p-4 pb-28 sm:p-6 sm:pb-28">
    {studyLink ? <Link to="/" className="inline-block text-sm font-medium text-accent-primary">← Estudar</Link> : <button type="button" onClick={back} className="text-sm font-medium text-accent-primary">← Voltar</button>}
    <header>
      <h1 className="text-2xl font-bold">{view === 'colors' ? 'Defina as cores' : view === 'palette' ? 'Escolha a cor' : 'Minhas matérias'}</h1>
      <p className="mt-1 text-sm text-text-secondary">{view === 'catalog' ? 'Escolha quais matérias aparecem ao concluir suas sessões e defina uma cor pessoal para cada uma.' : view === 'colors' ? 'Escolha uma cor para cada matéria selecionada. Você pode alterar depois.' : view === 'palette' ? paletteSubject?.name : 'Suas matérias selecionadas aparecem aqui. Você pode editar as cores ou adicionar novas a qualquer momento.'}</p>
    </header>
    {error && <p role="alert" className="rounded-xl border border-accent-danger/50 p-3 text-sm text-accent-danger">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-accent-success/50 p-3 text-sm text-accent-success">{notice}</p>}
    {!setup && !error && <p>Carregando matérias...</p>}

    {setup && view === 'catalog' && <>
      <label className="block"><span className="sr-only">Buscar matéria</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar matéria..." className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent-primary" /></label>
      <section aria-label={query.trim() ? 'Resultados da busca' : 'Catálogo do grupo'} className="space-y-3">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{query.trim() ? `Resultados (${results.length})` : 'Catálogo do grupo'}</h2>{!query.trim() && setup.subjects.length > 3 && <button type="button" onClick={() => setShowAll(value => !value)} className="text-sm text-accent-primary">{showAll ? 'Ver menos' : 'Ver todas'}</button>}</div>
        {!setup.subjects.length && <p className="text-sm text-text-secondary">Ainda não há matérias aprovadas.</p>}
        {!!setup.subjects.length && !results.length && <p className="text-sm text-text-secondary">Nenhuma matéria encontrada. Tente outro termo ou sugira uma nova matéria abaixo.</p>}
        {visible.map(subject => {
          const checked = draftIds.includes(subject.id);
          return <button key={subject.id} type="button" aria-pressed={checked} onClick={() => toggle(subject.id)} className={`${card} flex w-full items-center gap-3 text-left hover:border-accent-primary/70 focus-visible:outline-2 focus-visible:outline-accent-primary`}>
            <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded border text-xs ${checked ? 'border-accent-primary bg-accent-primary text-white' : 'border-text-muted'}`}>{checked ? '✓' : ''}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{subject.name}</span>
          </button>;
        })}
      </section>
      {!!setup.subjects.length && <button type="button" disabled={busy || !draftIds.length} onClick={() => setView('colors')} className={primaryButton}>Continuar ({draftIds.length}) →</button>}
    </>}

    {setup && view === 'colors' && <>
      <section className="space-y-3" aria-label="Cores das matérias selecionadas">
        {selected.map(subject => <button key={subject.id} type="button" onClick={() => openPalette(subject.id, 'colors')} className={`${card} flex w-full items-center gap-3 text-left hover:border-accent-primary/70 focus-visible:outline-2 focus-visible:outline-accent-primary`}>
          <span className="min-w-0 flex-1 truncate text-sm">{subject.name}</span>
          <span aria-hidden="true" className="size-6 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: subjectColor(subject.id, draftColors) }} />
          <span aria-hidden="true" className="text-text-muted">›</span>
        </button>)}
      </section>
      <button type="button" disabled={busy} onClick={() => void save(draftIds, draftColors, 'Suas matérias foram salvas.')} className={primaryButton}>{busy ? 'Salvando...' : 'Salvar matérias →'}</button>
    </>}

    {setup && view === 'palette' && paletteSubject && <>
      <p className="font-medium">{paletteSubject.name}</p>
      <fieldset><legend className="sr-only">Cor de {paletteSubject.name}</legend><div className="grid grid-cols-4 gap-4 py-3 sm:grid-cols-6">
        {colorOptions.map(color => <label key={color} className="relative flex cursor-pointer justify-center">
          <input type="radio" name="subject-color" value={color} checked={paletteColor === color} onChange={() => setPaletteColor(color)} className="peer sr-only" />
          <span className="flex size-12 items-center justify-center rounded-full border-2 border-transparent text-lg text-bg-primary peer-checked:border-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-primary" style={{ backgroundColor: color }}>{paletteColor === color ? '✓' : ''}</span>
          <span className="sr-only">{color}</span>
        </label>)}
      </div></fieldset>
      <button type="button" disabled={busy} onClick={() => {
        const colors = { ...draftColors, [paletteSubject.id]: paletteColor };
        if (paletteReturn === 'list') void save(draftIds, colors, 'Cor da matéria atualizada.');
        else { setDraftColors(colors); setView('colors'); }
      }} className={primaryButton}>{busy ? 'Salvando...' : 'Confirmar cor'}</button>
    </>}

    {setup && view === 'list' && <>
      <section aria-label="Matérias selecionadas" className="space-y-3">
        {selected.map(subject => <div key={subject.id} className={`${card} relative flex items-center gap-3`}>
          <span aria-hidden="true" className="size-5 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: subjectColor(subject.id, draftColors) }} />
          <span className="min-w-0 flex-1 truncate text-sm">{subject.name}</span>
          <button type="button" aria-label={`Opções de ${subject.name}`} aria-expanded={menuId === subject.id} onClick={() => setMenuId(current => current === subject.id ? null : subject.id)} className="rounded-lg px-2 text-xl text-text-secondary focus-visible:outline-2 focus-visible:outline-accent-primary">⋮</button>
          {menuId === subject.id && <div className="absolute right-3 top-12 z-10 min-w-40 rounded-xl border border-border bg-bg-tertiary p-1 shadow-xl">
            <button type="button" onClick={() => openPalette(subject.id, 'list')} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg-quaternary">Alterar cor</button>
            <button type="button" disabled={busy} onClick={() => void remove(subject.id)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-accent-danger hover:bg-bg-quaternary">Remover</button>
          </div>}
        </div>)}
      </section>
      <button type="button" onClick={() => { setQuery(''); setShowAll(false); setView('catalog'); setError(''); setNotice(''); }} className="w-full rounded-xl border border-accent-primary px-4 py-3 font-medium text-accent-primary">＋ Adicionar mais matérias</button>
      <p className={`${card} text-sm text-text-secondary`}>Essas matérias aparecerão ao final das suas sessões de estudo.</p>
    </>}

    {setup && (view === 'catalog' || view === 'list') && <>
      {setup.isAdmin ? <p className="text-sm text-text-secondary">Para cadastrar matérias e avaliar sugestões, acesse a <Link to="/admin" className="text-accent-primary underline">aba Admin</Link>.</p> : <form onSubmit={event => void submitSuggestion(event)} className={`${card} space-y-3`}>
        <h2 className="font-semibold">Sugerir matéria</h2>
        <p className="text-sm text-text-secondary">O administrador pode aprovar, ajustar o nome ou rejeitar a sugestão.</p>
        <input aria-label="Nome da matéria" className="w-full rounded-xl border border-border bg-bg-primary p-3" minLength={2} maxLength={80} required value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Matemática" />
        <button disabled={busy} className={primaryButton}>Enviar sugestão</button>
      </form>}
      {!setup.isAdmin && setup.requests.some(request => request.status === 'pending') && <section className={`${card} space-y-2`}><h2 className="font-semibold">Minhas sugestões pendentes</h2>{setup.requests.filter(request => request.status === 'pending').map(request => <p key={request.id} className="text-sm text-text-secondary">{request.name}</p>)}</section>}
    </>}
  </div>;
}
