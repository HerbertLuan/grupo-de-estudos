import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getSubjectSetup, requestSubject, saveSubjectSetup, type SubjectSetup } from '../services/subjectService';
import { subjectColor } from '../utils/subjectColor';
import { Badge, Button, Card, Icon, PageHeader } from '../components/ui/DesignSystem';
import '../pages/study-redesign.css';

type View = 'catalog' | 'colors' | 'palette' | 'list';
const palette = ['#d77af5', '#f57380', '#ffa64d', '#ffd84f', '#6dca7b', '#54c9c3', '#70b8ff', '#6688f5', '#f27bbb', '#ad98e8', '#777d89'];
const card = 'rounded-xl border border-border bg-bg-secondary p-4';
const primaryButton = 'ej-button ej-button-primary w-full';

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
  return <div className="ej-page subjects-workspace">
    <PageHeader eyebrow="ORGANIZAÇÃO QUE VIRA EVOLUÇÃO" title={view === 'colors' ? 'Dê cor ao seu foco.' : view === 'palette' ? 'Sua matéria, sua cor.' : 'Minhas matérias'}
      description={view === 'catalog' ? 'Selecione as matérias que fazem parte da sua jornada de estudos.' : view === 'colors' ? 'Uma identidade para cada matéria. Reconheça seu progresso num olhar.' : view === 'palette' ? paletteSubject?.name : 'Seu conhecimento, organizado. Tudo pronto para o próximo estudo.'}
      actions={studyLink ? <Link to="/" className="ej-button ej-button-secondary"><Icon name="study" size={17} />Ir estudar</Link> : <Button variant="secondary" onClick={back}>← Voltar</Button>} />
    {error && <p role="alert" className="rounded-xl border border-accent-danger/35 bg-accent-danger/5 p-4 text-sm text-accent-danger">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-accent-success/30 bg-accent-success/5 p-4 text-sm text-accent-success"><Icon name="check" size={18} />{notice}</p>}
    {!setup && !error && <Card className="p-6" role="status"><p className="text-sm text-text-secondary">Preparando seu catálogo de matérias...</p><div className="mt-5 grid gap-3">{[1, 2, 3].map(i => <div key={i} className="ej-skeleton h-16" />)}</div></Card>}
    {setup && <div className="subjects-workspace-grid">
      <div className="min-w-0 space-y-5">
        {view === 'catalog' && <>
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div><p className="ej-eyebrow">01 / SELECIONE</p><h2 className="mt-2 text-lg font-semibold">Seu catálogo de estudos</h2></div><Badge tone="blue">{draftIds.length} selecionada(s)</Badge></div>
            <label className="mb-5 block"><span className="sr-only">Buscar matéria</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Encontre uma matéria..." className="ej-input w-full" /></label>
            <section aria-label={query.trim() ? 'Resultados da busca' : 'Catálogo do grupo'} className="space-y-3">
              <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-medium text-text-muted">{query.trim() ? `Resultados (${results.length})` : `${setup.subjects.length} matérias do grupo`}</h3>{!query.trim() && setup.subjects.length > 3 && <button type="button" onClick={() => setShowAll(value => !value)} className="min-h-11 text-xs font-medium text-accent-primary-hover">{showAll ? 'Mostrar menos' : 'Ver todas'}</button>}</div>
              {!setup.subjects.length && <div className="subject-empty"><Icon name="subjects" size={30} /><h3>O catálogo começa aqui.</h3><p>Ainda não há matérias aprovadas. {setup.isAdmin ? 'Cadastre a primeira na administração do grupo.' : 'Sugira uma matéria para começar.'}</p></div>}
              {!!setup.subjects.length && !results.length && <div className="subject-empty"><h3>Nenhuma matéria encontrada.</h3><p>Tente outro termo ou sugira uma nova matéria.</p></div>}
              {visible.map(subject => {
                const checked = draftIds.includes(subject.id);
                return <button key={subject.id} type="button" aria-pressed={checked} onClick={() => toggle(subject.id)} className={`subject-select-row ${checked ? 'is-selected' : ''}`}>
                  <span aria-hidden="true" className="subject-check">{checked && <Icon name="check" size={14} />}</span>
                  <span className="min-w-0 flex-1 text-sm font-medium">{subject.name}</span>
                  {checked && <span className="text-xs text-accent-primary-hover">Na sua lista</span>}
                </button>;
              })}
            </section>
            {!!setup.subjects.length && <button type="button" disabled={busy || !draftIds.length} onClick={() => setView('colors')} className={`${primaryButton} mt-6`}>Definir cores <span className="ml-auto">{draftIds.length}</span><Icon name="arrow" size={17} /></button>}
          </Card>
        </>}

        {view === 'colors' && <Card className="space-y-5 p-5 sm:p-6">
          <div><p className="ej-eyebrow">02 / PERSONALIZE</p><h2 className="mt-2 text-lg font-semibold">Um toque seu</h2></div>
          <section className="space-y-3" aria-label="Cores das matérias selecionadas">
            {selected.map(subject => <button key={subject.id} type="button" onClick={() => openPalette(subject.id, 'colors')} className="subject-select-row">
              <span aria-hidden="true" className="subject-color-swatch" style={{ backgroundColor: subjectColor(subject.id, draftColors) }} />
              <span className="min-w-0 flex-1 text-sm font-medium">{subject.name}</span>
              <span className="text-xs text-text-muted">Alterar cor</span><Icon name="arrow" size={16} />
            </button>)}
          </section>
          <button type="button" disabled={busy} onClick={() => void save(draftIds, draftColors, 'Suas matérias foram salvas.')} className={primaryButton}>{busy ? 'Salvando...' : 'Salvar minhas matérias'}<Icon name="check" size={17} /></button>
        </Card>}

        {view === 'palette' && paletteSubject && <Card className="space-y-6 p-5 sm:p-6">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-bg-primary p-4"><span className="subject-color-swatch" style={{ backgroundColor: paletteColor }} /><div><p className="text-xs text-text-muted">Prévia da matéria</p><p className="mt-1 font-semibold">{paletteSubject.name}</p></div></div>
          <fieldset><legend className="mb-3 text-sm font-medium">Escolha uma cor</legend><div className="grid grid-cols-4 gap-4 py-3 sm:grid-cols-6">
            {colorOptions.map(color => <label key={color} className="relative flex cursor-pointer justify-center">
              <input type="radio" name="subject-color" value={color} checked={paletteColor === color} onChange={() => setPaletteColor(color)} className="peer sr-only" />
              <span className="flex size-12 items-center justify-center rounded-xl border-2 border-transparent text-lg text-[#0b1b3b] peer-checked:border-white peer-checked:ring-2 peer-checked:ring-accent-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent-primary" style={{ backgroundColor: color }}>{paletteColor === color && <Icon name="check" />}</span>
              <span className="sr-only">{color}</span>
            </label>)}
          </div></fieldset>
          <button type="button" disabled={busy} onClick={() => {
            const colors = { ...draftColors, [paletteSubject.id]: paletteColor };
            if (paletteReturn === 'list') void save(draftIds, colors, 'Cor da matéria atualizada.');
            else { setDraftColors(colors); setView('colors'); }
          }} className={primaryButton}>{busy ? 'Salvando...' : 'Confirmar cor'}<Icon name="check" size={17} /></button>
        </Card>}

        {view === 'list' && <Card className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Meu plano de estudos</h2><Badge tone="blue">{selected.length} matérias</Badge></div>
          <section aria-label="Matérias selecionadas" className="space-y-3">
            {selected.map(subject => <div key={subject.id} className="subject-select-row relative">
              <span aria-hidden="true" className="subject-color-swatch" style={{ backgroundColor: subjectColor(subject.id, draftColors) }} />
              <span className="min-w-0 flex-1 text-sm font-medium">{subject.name}</span>
              <button type="button" aria-label={`Opções de ${subject.name}`} aria-expanded={menuId === subject.id} onClick={() => setMenuId(current => current === subject.id ? null : subject.id)} className="ej-icon-button text-xl">⋮</button>
              {menuId === subject.id && <div className="absolute right-3 top-16 z-10 min-w-44 rounded-xl border border-border bg-bg-tertiary p-1 shadow-xl">
                <button type="button" onClick={() => openPalette(subject.id, 'list')} className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg-quaternary">Alterar cor</button>
                <button type="button" disabled={busy} onClick={() => void remove(subject.id)} className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm text-accent-danger hover:bg-bg-quaternary">Remover da lista</button>
              </div>}
            </div>)}
          </section>
          <Button variant="secondary" className="w-full" onClick={() => { setQuery(''); setShowAll(false); setView('catalog'); setError(''); setNotice(''); }}><span aria-hidden="true">＋</span>Adicionar matérias</Button>
        </Card>}
      </div>

      <aside className="space-y-5">
        <Card className="subject-context-card p-5 sm:p-6"><div className="study-shortcut-icon mb-5"><Icon name="subjects" /></div><h2 className="text-base font-semibold">Conhecer seu estudo é evoluir.</h2><p className="mt-3 text-sm leading-relaxed text-text-secondary">Ao finalizar uma sessão, escolha a matéria e registre suas questões. Cada detalhe ajuda a enxergar seu progresso.</p><Link to="/progress" className="study-text-link mt-5">Acompanhar evolução <Icon name="arrow" size={16} /></Link></Card>
        {(view === 'catalog' || view === 'list') && <>
          {setup.isAdmin ? <Card className="p-5"><Badge tone="purple">Administração</Badge><p className="my-4 text-sm leading-relaxed text-text-secondary">Cadastre matérias e avalie as sugestões do seu grupo.</p><Link to="/admin" className="study-text-link">Gerenciar catálogo <Icon name="arrow" size={16} /></Link></Card> : <form onSubmit={event => void submitSuggestion(event)} className={`${card} space-y-4`}>
            <h2 className="font-semibold">Faltou uma matéria?</h2>
            <p className="text-sm leading-relaxed text-text-secondary">Envie uma sugestão para avaliação do administrador.</p>
            <label className="block"><span className="mb-2 block text-xs font-medium text-text-secondary">Nome da matéria</span><input className="ej-input w-full" minLength={2} maxLength={80} required value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Matemática" /></label>
            <Button disabled={busy} className="w-full" variant="secondary" type="submit">Enviar sugestão <Icon name="arrow" size={16} /></Button>
          </form>}
          {!setup.isAdmin && setup.requests.some(request => request.status === 'pending') && <Card className="space-y-3 p-5"><h2 className="text-sm font-semibold">Aguardando aprovação</h2>{setup.requests.filter(request => request.status === 'pending').map(request => <div key={request.id} className="flex items-center justify-between gap-2 border-t border-border pt-3 text-sm"><span>{request.name}</span><Badge>Pendente</Badge></div>)}</Card>}
        </>}
      </aside>
    </div>}
  </div>;
}
