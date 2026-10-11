import { useState, useEffect, useRef } from 'react'
import { seed, SUBJECTS, DAYS, CATS } from './data'
import { ask } from './ai'

const KEY = 'circle_db_v1', SES = 'circle_me'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed() } catch { return seed() } }
const ROLE = { student: 'Студент', moderator: 'Модератор', admin: 'Администратор' }
const fmt = d => new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
const sname = id => SUBJECTS.find(s => s.id === id)?.name
const NAV = [['home', 'Главная'], ['grades', 'Табель'], ['schedule', 'Расписание'], ['campus', 'Кампус'], ['teams', 'Свои'], ['ai', 'AI-помощник'], ['rating', 'Рейтинг'], ['me', 'Кабинет']]

const Logo = ({ s = 34 }) => (
  <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-hidden><circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="3.5" /><circle cx="31" cy="12" r="4.5" fill="var(--acc)" /></svg>
)
const Brand = () => <div className="brand"><Logo /><span>Circle</span></div>
const Ava = ({ n, s = 40 }) => <div className="ava" style={{ width: s, height: s, fontSize: s * .4 }}>{(n || '?').split(' ').map(x => x[0]).join('').slice(0, 2)}</div>

export default function App() {
  const [db, setDb] = useState(load)
  const [meId, setMeId] = useState(() => localStorage.getItem(SES))
  const [page, setPage] = useState('home')
  const [toast, setToast] = useState('')
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)) }, [db])
  const up = fn => setDb(d => { const n = structuredClone(d); fn(n); return n })
  const say = m => { setToast(m); setTimeout(() => setToast(''), 3200) }
  const me = db.users.find(x => x.id === meId)
  const nav = NAV.concat(me && me.role !== 'student' ? [['mod', me.role === 'admin' ? 'Админ-комната' : 'Модерация']] : [])
  const ctx = { db, me, up, say, go: setPage }

  if (!me) return <Auth db={db} up={up} onLogin={id => { localStorage.setItem(SES, id); setMeId(id); setPage('home') }} />
  const P = { home: Home, grades: Grades, schedule: Schedule, campus: Campus, teams: Teams, ai: AI, rating: Rating, me: Cabinet, mod: Mod }[page]
  return (
    <div className="shell">
      <aside className="side">
        <Brand />
        <nav>{nav.map(([k, l]) => <button key={k} className={'nav' + (page === k ? ' on' : '')} onClick={() => setPage(k)}>{l}</button>)}</nav>
        <button className="nav out" onClick={() => { localStorage.removeItem(SES); setMeId(null) }}>Выйти</button>
      </aside>
      <main className="main"><P {...ctx} /></main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Auth({ db, up, onLogin }) {
  const [reg, setReg] = useState(false), [f, setF] = useState({ name: '', email: '', password: '', group: '' }), [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = e => {
    e.preventDefault(); setErr('')
    if (!reg) {
      const u = db.users.find(x => x.email === f.email.trim().toLowerCase() && x.password === f.password)
      return u ? onLogin(u.id) : setErr('Неверная почта или пароль.')
    }
    if (!f.name || !f.email || f.password.length < 6) return setErr('Заполните имя, почту и пароль (от 6 символов).')
    if (db.users.some(x => x.email === f.email.trim().toLowerCase())) return setErr('Эта почта уже зарегистрирована.')
    const id = 'u' + Date.now()
    up(d => { d.users.push({ id, name: f.name, email: f.email.trim().toLowerCase(), password: f.password, role: 'student', group: f.group || '—', skills: [], bio: '', points: 0 }); d.grades[id] = structuredClone(d.grades.u2) })
    onLogin(id)
  }
  return (
    <div className="auth">
      <div className="auth-art"><Logo s={64} /><h1>Учёба, кампус и твои люди — в одном месте.</h1><p>Расписание, табель и команды для хакатонов, клубов и дебатов.</p></div>
      <form className="auth-card" onSubmit={submit}>
        <h2>{reg ? 'Регистрация' : 'Вход'}</h2>
        {reg && <><input placeholder="Имя и фамилия" value={f.name} onChange={set('name')} /><input placeholder="Группа (например, ИС-23)" value={f.group} onChange={set('group')} /></>}
        <input type="email" placeholder="Почта" value={f.email} onChange={set('email')} />
        <input type="password" placeholder="Пароль" value={f.password} onChange={set('password')} />
        {err && <div className="err">{err}</div>}
        <button className="btn" type="submit">{reg ? 'Создать аккаунт' : 'Войти'}</button>
        <button type="button" className="btn ghost" onClick={() => { setReg(!reg); setErr('') }}>{reg ? 'У меня есть аккаунт' : 'Создать аккаунт'}</button>
        {!reg && <div className="demo"><span>Демо-аккаунты</span>{db.users.slice(0, 6).map(u => <button type="button" key={u.id} onClick={() => setF({ ...f, email: u.email, password: u.password })}>{u.name.split(' ')[0]} · {ROLE[u.role].toLowerCase()}</button>)}</div>}
      </form>
    </div>
  )
}

const Head = ({ t, s }) => <header className="head"><h1>{t}</h1>{s && <p>{s}</p>}</header>
const todayIdx = () => { const w = (new Date().getDay() + 6) % 7; return w > 4 ? 0 : w }
const Lesson = ({ x }) => (
  <div className="lesson"><div className="time"><b>{x.s}</b><span>{x.e}</span></div>
    <div className="grow"><h3>{sname(x.sub)}</h3><p>{SUBJECTS.find(s => s.id === x.sub).teacher}</p></div>
    <div className="room">ауд. {x.room}<small>{x.type}</small></div></div>
)
const stats = (db, id) => {
  const g = db.grades[id] || {}, r = SUBJECTS.filter(s => g[s.id]).map(s => ({ ...s, avg: g[s.id][0], att: g[s.id][1] }))
  return { r, mean: r.length ? Math.round(r.reduce((a, x) => a + x.avg, 0) / r.length) : 0, att: r.length ? Math.round(r.reduce((a, x) => a + x.att, 0) / r.length) : 0 }
}

function Home({ db, me, go }) {
  const st = stats(db, me.id), d = todayIdx()
  const rank = db.users.filter(u => u.role === 'student').sort((a, b) => b.points - a.points).findIndex(u => u.id === me.id) + 1
  const mine = db.apps.filter(a => a.user === me.id && a.status === 'pending').length
  return <>
    <Head t={`Привет, ${me.name.split(' ')[0]}`} s={`Сегодня ${DAYS[d]}. Вот что важно.`} />
    <div className="grid3">
      <button className="stat" onClick={() => go('grades')}><span>Средний балл</span><b>{st.mean || '—'}</b></button>
      <button className="stat" onClick={() => go('grades')}><span>Посещаемость</span><b>{st.att ? st.att + '%' : '—'}</b></button>
      <button className="stat" onClick={() => go('rating')}><span>Место в рейтинге</span><b>{rank || '—'}</b></button>
    </div>
    <h2 className="sec">Пары сегодня</h2>
    <div className="list">{db.schedule.filter(x => x.d === d).map((x, i) => <Lesson key={i} x={x} />)}</div>
    <div className="grid2">
      <button className="tile dark" onClick={() => go('teams')}><h3>Найди своих</h3><p>{mine ? `Заявок на рассмотрении: ${mine}` : 'Команды для хакатонов, клубов и дебатов.'}</p></button>
      <button className="tile" onClick={() => go('ai')}><h3>Спросить AI-помощника</h3><p>Успеваемость, события и совет, где подтянуться.</p></button>
    </div>
  </>
}

function Grades({ db, me }) {
  const { r, mean, att } = stats(db, me.id)
  return <>
    <Head t="Табель" s="Средний балл и посещаемость по предметам." />
    <div className="grid2"><div className="stat static"><span>Средний балл</span><b>{mean || '—'}</b></div><div className="stat static"><span>Посещаемость</span><b>{att ? att + '%' : '—'}</b></div></div>
    <div className="list">{r.map(x => (
      <div className="row" key={x.id}>
        <div className="grow"><h3>{x.name}</h3><div className="bar"><i className={x.avg < 70 ? 'low' : ''} style={{ width: x.avg + '%' }} /></div></div>
        <div className="num"><b>{x.avg}</b><small>балл</small></div>
        <div className={'num' + (x.att < 70 ? ' warn' : '')}><b>{x.att}%</b><small>посещ.</small></div>
      </div>))}</div>
  </>
}

function Schedule({ db }) {
  const [d, setD] = useState(todayIdx())
  const list = db.schedule.filter(x => x.d === d)
  return <>
    <Head t="Расписание" s="Время, предмет, аудитория и преподаватель." />
    <div className="seg">{DAYS.map((x, i) => <button key={x} className={d === i ? 'on' : ''} onClick={() => setD(i)}>{x}</button>)}</div>
    <div className="list">{list.length ? list.map((x, i) => <Lesson key={i} x={x} />) : <p className="empty">В этот день пар нет.</p>}</div>
  </>
}

function Campus({ db }) {
  const ev = [...db.events].sort((a, b) => a.date.localeCompare(b.date))
  return <>
    <Head t="Кампус" s="События университета на ближайшие недели." />
    <div className="list">{ev.map(e => <div className="row" key={e.id}>
      <div className="date"><b>{new Date(e.date).getDate()}</b><span>{new Date(e.date).toLocaleDateString('ru', { month: 'short' })}</span></div>
      <div className="grow"><h3>{e.title}</h3><p>{e.place}</p></div><span className="chip">{e.tag}</span></div>)}</div>
  </>
}

function Teams({ db, me, up, say }) {
  const [cat, setCat] = useState('Все'), [open, setOpen] = useState(null), [ap, setAp] = useState(null), [msg, setMsg] = useState('')
  if (open) return <TeamRoom id={open} back={() => setOpen(null)} {...{ db, me, up, say }} />
  const list = db.teams.filter(t => !t.hidden && (cat === 'Все' || t.cat === cat))
  const send = t => {
    if (!msg.trim()) return say('Расскажите о себе в паре слов.')
    const id = 'ap' + Date.now()
    up(d => d.apps.push({ id, team: t.id, user: me.id, msg, status: 'pending' }))
    setAp(null); setMsg(''); say('Заявка отправлена лидеру.')
    setTimeout(() => up(d => { // имитация: лидер принимает через несколько секунд
      const a = d.apps.find(x => x.id === id), tm = d.teams.find(x => x.id === t.id)
      if (a && a.status === 'pending') { a.status = 'accepted'; tm.members.push(me.id); (d.chat[tm.id] ||= []).push({ u: tm.leader, t: `Добро пожаловать, ${me.name.split(' ')[0]}!` }); }
    }) || say(`Лидер «${t.title}» принял вас. Чат открыт.`), 6000)
  }
  return <div className="dark-zone">
    <header className="head"><h1>Свои</h1><p>Не все каналы видны всем. Подай заявку — лидер решит, подходишь ли ты.</p></header>
    <div className="seg dark">{CATS.map(c => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
    <div className="list">{list.map(t => {
      const mine = t.members.includes(me.id), app = db.apps.find(a => a.team === t.id && a.user === me.id && a.status === 'pending'), lead = t.leader === me.id
      const pend = db.apps.filter(a => a.team === t.id && a.status === 'pending').length
      return <div className="team" key={t.id}>
        <div className="between"><span className="chip dk">{t.cat}</span><span className="mono">{t.members.length}/{t.members.length + t.slots}</span></div>
        <h3>{t.title}</h3><p>{t.desc}</p>
        <div className="tags">{t.need.map(n => <span key={n}>{n}</span>)}</div>
        <div className="between"><span className="mono">лидер: {db.users.find(u => u.id === t.leader)?.name}</span>
          {mine ? <button className="btn sm" onClick={() => setOpen(t.id)}>{lead && pend ? `Чат · заявок ${pend}` : 'Открыть чат'}</button>
            : app ? <span className="mono">заявка на рассмотрении…</span>
              : <button className="btn sm" onClick={() => setAp(ap === t.id ? null : t.id)}>Подать заявку</button>}</div>
        {ap === t.id && <div className="apply"><textarea placeholder="Почему ты подходишь? Лидер увидит твои навыки из кабинета." value={msg} onChange={e => setMsg(e.target.value)} /><button className="btn sm" onClick={() => send(t)}>Отправить</button></div>}
      </div>
    })}</div>
  </div>
}

function TeamRoom({ id, back, db, me, up, say }) {
  const t = db.teams.find(x => x.id === id), [tab, setTab] = useState('chat'), [txt, setTxt] = useState(''), end = useRef()
  const lead = t.leader === me.id, msgs = db.chat[id] || [], pend = db.apps.filter(a => a.team === id && a.status === 'pending')
  useEffect(() => { end.current?.scrollIntoView() }, [msgs.length, tab])
  const send = e => {
    e.preventDefault(); if (!txt.trim()) return
    up(d => (d.chat[id] ||= []).push({ u: me.id, t: txt })); setTxt('')
    const others = t.members.filter(m => m !== me.id)
    if (others.length) setTimeout(() => up(d => (d.chat[id] ||= []).push({ u: others[0], t: ['Принято!', 'Отлично, давайте так.', 'Супер, я на связи.'][Math.floor(Math.random() * 3)] })), 1400)
  }
  const decide = (a, ok) => up(d => {
    const x = d.apps.find(y => y.id === a.id); x.status = ok ? 'accepted' : 'declined'
    if (ok) { d.teams.find(y => y.id === id).members.push(a.user); (d.chat[id] ||= []).push({ u: me.id, t: `${d.users.find(u => u.id === a.user).name} теперь в команде.` }) }
  })
  return <div className="dark-zone">
    <button className="back" onClick={back}>← Все команды</button>
    <header className="head"><h1>{t.title}</h1><p>{t.members.length} участн. · {t.cat}</p></header>
    {lead && <div className="seg dark"><button className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')}>Чат</button><button className={tab === 'apps' ? 'on' : ''} onClick={() => setTab('apps')}>Заявки {pend.length ? `(${pend.length})` : ''}</button></div>}
    {tab === 'chat' ? <>
      <div className="chat">{msgs.map((m, i) => { const u = db.users.find(x => x.id === m.u); return <div key={i} className={'msg' + (m.u === me.id ? ' me' : '')}><small>{u?.name.split(' ')[0]}</small>{m.t}</div> })}<div ref={end} /></div>
      <form className="send" onSubmit={send}><input placeholder="Сообщение" value={txt} onChange={e => setTxt(e.target.value)} /><button className="btn sm">Отправить</button></form>
    </> : <div className="list">{pend.length ? pend.map(a => { const u = db.users.find(x => x.id === a.user); return <div className="team" key={a.id}>
      <div className="between"><h3>{u.name}</h3><span className="mono">{u.group}</span></div><p>«{a.msg}»</p>
      <div className="tags">{u.skills.map(s => <span key={s}>{s}</span>)}</div>
      <div className="between"><span className="mono">рейтинг: {u.points}</span><div className="gap"><button className="btn sm ghost" onClick={() => decide(a, false)}>Отклонить</button><button className="btn sm" onClick={() => decide(a, true)}>Принять</button></div></div></div> }) : <p className="empty">Новых заявок нет.</p>}</div>}
  </div>
}

function AI({ db, me, go }) {
  const [log, setLog] = useState([{ b: 1, text: `Здравствуй, ${me.name.split(' ')[0]}! Спроси про успеваемость, расписание, события или рейтинг.` }]), [q, setQ] = useState(''), end = useRef()
  useEffect(() => { end.current?.scrollIntoView() }, [log])
  const send = t => { if (!t.trim()) return; setLog(l => [...l, { text: t }]); setQ(''); setTimeout(() => setLog(l => [...l, { b: 1, ...ask(me, db, t) }]), 600) }
  return <>
    <Head t="AI-помощник" s="Знает твой табель, расписание и события кампуса." />
    <div className="quick">{['Как моя успеваемость?', 'Что сегодня по парам?', 'Какие события скоро?', 'Найти команду', 'Мой рейтинг'].map(x => <button key={x} onClick={() => send(x)}>{x}</button>)}</div>
    <div className="chat light">{log.map((m, i) => <div key={i} className={'msg' + (m.b ? ' bot' : ' me')}>{m.text}{m.teams && m.teams.map(id => <button key={id} className="link" onClick={() => go('teams')}>{db.teams.find(t => t.id === id).title} — открыть</button>)}</div>)}<div ref={end} /></div>
    <form className="send" onSubmit={e => { e.preventDefault(); send(q) }}><input placeholder="Напишите вопрос" value={q} onChange={e => setQ(e.target.value)} /><button className="btn sm">Отправить</button></form>
  </>
}

function Rating({ db, me, up, say }) {
  const r = db.users.filter(u => u.role === 'student').sort((a, b) => b.points - a.points)
  const done = k => up(d => { const t = d.tasks.find(x => x.id === k); if (t.by.includes(me.id)) return; t.by.push(me.id); d.users.find(u => u.id === me.id).points += t.pts; }) || say('Задание выполнено, баллы начислены.')
  return <>
    <Head t="Рейтинг" s="Баллы начисляются за выполненные задания." />
    <div className="list">{r.map((u, i) => <div className={'row' + (u.id === me.id ? ' mine' : '')} key={u.id}><div className="date"><b>{i + 1}</b></div><Ava n={u.name} /><div className="grow"><h3>{u.name}</h3><p>{u.group}</p></div><div className="num"><b>{u.points}</b><small>баллов</small></div></div>)}</div>
    {me.role === 'student' && <><h2 className="sec">Задания</h2><div className="list">{db.tasks.map(t => { const ok = t.by.includes(me.id); return <div className="row" key={t.id}><div className="grow"><h3>{t.title}</h3><p>+{t.pts} баллов</p></div><button className={'btn sm' + (ok ? ' ghost' : '')} disabled={ok} onClick={() => done(t.id)}>{ok ? 'Выполнено' : 'Выполнить'}</button></div> })}</div></>}
  </>
}

function Cabinet({ db, me, up, say }) {
  const [f, setF] = useState({ name: me.name, group: me.group, bio: me.bio, skills: me.skills.join(', ') })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const save = () => { up(d => Object.assign(d.users.find(u => u.id === me.id), { name: f.name, group: f.group, bio: f.bio, skills: f.skills.split(',').map(s => s.trim()).filter(Boolean) })); say('Профиль сохранён.') }
  const teams = db.teams.filter(t => t.members.includes(me.id))
  return <>
    <Head t="Кабинет" s="Навыки видны лидерам команд при рассмотрении заявок." />
    <div className="profile"><Ava n={me.name} s={72} /><div><h2>{me.name}</h2><span className="chip">{ROLE[me.role]}</span><p>{me.email}</p></div></div>
    <div className="form"><label>Имя<input value={f.name} onChange={set('name')} /></label><label>Группа<input value={f.group} onChange={set('group')} /></label>
      <label>О себе<textarea value={f.bio} onChange={set('bio')} /></label><label>Навыки через запятую<input value={f.skills} onChange={set('skills')} placeholder="Python, Debate, Figma" /></label>
      <button className="btn" onClick={save}>Сохранить</button></div>
    <h2 className="sec">Мои команды</h2><div className="list">{teams.length ? teams.map(t => <div className="row" key={t.id}><div className="grow"><h3>{t.title}</h3><p>{t.cat}</p></div></div>) : <p className="empty">Вы пока не состоите в командах.</p>}</div>
  </>
}

function Mod({ db, me, up, say }) {
  const adm = me.role === 'admin'
  return <>
    <Head t={adm ? 'Админ-комната' : 'Модерация'} s={adm ? 'Роли пользователей и сообщества.' : 'Управление видимостью сообществ.'} />
    <h2 className="sec">Сообщества</h2>
    <div className="list">{db.teams.map(t => <div className="row" key={t.id}><div className="grow"><h3>{t.title}</h3><p>{t.cat} · {t.members.length} участн.{t.hidden ? ' · скрыто' : ''}</p></div>
      <button className={'btn sm' + (t.hidden ? '' : ' ghost')} onClick={() => { up(d => { const x = d.teams.find(y => y.id === t.id); x.hidden = !x.hidden }); say(t.hidden ? 'Сообщество показано.' : 'Сообщество скрыто.') }}>{t.hidden ? 'Показать' : 'Скрыть'}</button></div>)}</div>
    {adm && <><h2 className="sec">Пользователи</h2><div className="list">{db.users.map(u => <div className="row" key={u.id}><Ava n={u.name} /><div className="grow"><h3>{u.name}</h3><p>{u.email}</p></div>
      <select value={u.role} disabled={u.id === me.id} onChange={e => { up(d => { d.users.find(x => x.id === u.id).role = e.target.value }); say('Роль изменена.') }}>{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>)}</div></>}
  </>
}
