import { SUBJECTS, CAT_OF } from './data'
const fmt = d => new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'long' })

export function ask(me, db, q) {
  const t = q.toLowerCase(), g = db.grades[me.id] || {}
  const rows = SUBJECTS.filter(s => g[s.id]).map(s => ({ ...s, avg: g[s.id][0], att: g[s.id][1] })).sort((a, b) => a.avg - b.avg)
  const first = me.name.split(' ')[0]
  const teamsFor = cat => db.teams.filter(x => !x.hidden && x.cat === cat && !x.members.includes(me.id)).map(x => x.id)

  if (/успеваем|оцен|табел|балл|посещ/.test(t)) {
    if (!rows.length) return { text: 'Пока нет данных об успеваемости.' }
    const mean = Math.round(rows.reduce((a, r) => a + r.avg, 0) / rows.length)
    const low = rows[0], skip = rows.filter(r => r.att < 70)
    let text = `${first}, твой средний балл — ${mean}.\nСильнее всего: ${rows[rows.length - 1].name} (${rows[rows.length - 1].avg}).\nСлабее всего: ${low.name} (${low.avg}).`
    if (skip.length) text += `\n\nВнимание: посещаемость ниже 70% по предмету «${skip[0].name}» (${skip[0].att}%). Это риск недопуска к экзамену.`
    return { text }
  }
  if (/расписан|пара|пары|сегодня|завтра/.test(t)) {
    const wd = (new Date().getDay() + 6) % 7 + (/завтра/.test(t) ? 1 : 0), d = wd > 4 ? 0 : wd
    const list = db.schedule.filter(x => x.d === d).map(x => `${x.s} — ${SUBJECTS.find(s => s.id === x.sub).name}, ауд. ${x.room}`)
    return { text: list.length ? `Пары (${['понедельник', 'вторник', 'среда', 'четверг', 'пятница'][d]}):\n${list.join('\n')}` : 'Пар нет.' }
  }
  if (/событ|мероприят|кампус/.test(t)) {
    const ev = [...db.events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
    return { text: 'Ближайшие события:\n' + ev.map(e => `${fmt(e.date)} — ${e.title} (${e.place})`).join('\n') }
  }
  if (/рейтинг|мест|баллы/.test(t)) {
    const r = db.users.filter(x => x.role === 'student').sort((a, b) => b.points - a.points)
    const i = r.findIndex(x => x.id === me.id)
    return { text: i < 0 ? 'Рейтинг только для студентов.' : `Ты на ${i + 1}-м месте из ${r.length}, ${me.points} баллов. Выполняй задания во вкладке «Рейтинг», чтобы подняться.` }
  }
  if (/команд|найти|единомышл|хакатон|дебат|матем|помощ|совет/.test(t) || true) {
    if (!rows.length) return { text: 'Я могу рассказать про успеваемость, расписание, события и рейтинг. Спроси что-нибудь из этого.' }
    const matched = /матем|матан/.test(t) ? 'math' : rows[0].id
    const cat = CAT_OF[matched], ids = teamsFor(cat)
    const subj = SUBJECTS.find(s => s.id === matched).name
    if (!/команд|найти|единомышл|хакатон|дебат|матем|совет|помощ/.test(t)) return { text: 'Я могу рассказать про успеваемость, расписание, события и рейтинг. Или посоветую команду — напиши «найти команду».' }
    return { text: `Лучше всего подтянуть «${subj}» (${g[matched][0]} баллов). Рекомендую группу из раздела «${cat}»:`, teams: ids.length ? ids : undefined }
  }
}
