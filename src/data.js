const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
export const SUBJECTS = [
  { id: 'math', name: 'Математический анализ', teacher: 'Асанов Б. К.' },
  { id: 'prog', name: 'Программирование', teacher: 'Сыдыков Т. А.' },
  { id: 'eng', name: 'Английский язык', teacher: 'Иманова Н. Р.' },
  { id: 'db', name: 'Базы данных', teacher: 'Токтогулов Э. М.' },
  { id: 'phil', name: 'Философия', teacher: 'Абдыкадыров Ч. С.' },
]
export const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']
export const CATS = ['Все', 'Talking club', 'Хакатон', 'Дебаты', 'Математика', 'Проект']
export const CAT_OF = { math: 'Математика', eng: 'Talking club', prog: 'Хакатон', db: 'Хакатон', phil: 'Дебаты' }

const u = (id, name, email, password, role, group, skills, bio, points) => ({ id, name, email, password, role, group, skills, bio, points })

export const seed = () => ({
  users: [
    u('u1', 'Айбек Эсенов', 'aibek@circle.kg', 'student123', 'student', 'ИС-23', ['Python', 'React', 'FastAPI'], 'Backend и хакатоны. Хочу подтянуть матан.', 420),
    u('u2', 'Айзада Мамытова', 'aizada@circle.kg', 'student123', 'student', 'ИС-23', ['UI/UX', 'English', 'Figma'], 'Дизайн, готовлюсь к IELTS.', 360),
    u('u3', 'Нурбек Талантов', 'nurbek@circle.kg', 'student123', 'student', 'ИС-22', ['Math', 'C++', 'Олимпиады'], 'Олимпиадная математика, веду кружок.', 510),
    u('u4', 'Элина Султанова', 'elina@circle.kg', 'student123', 'student', 'ИС-24', ['Debate', 'Public speaking'], 'Дебаты и ораторское искусство.', 290),
    u('m1', 'Мээрим Кубатова', 'mod@circle.kg', 'mod12345', 'moderator', 'Деканат', [], 'Модератор сообществ.', 0),
    u('a1', 'Администратор', 'admin@circle.kg', 'admin12345', 'admin', 'Деканат', [], 'Администратор платформы.', 0),
  ],
  grades: {
    u1: { math: [64, 82], prog: [95, 98], eng: [88, 90], db: [91, 94], phil: [79, 85] },
    u2: { math: [74, 70], prog: [81, 88], eng: [93, 97], db: [69, 58], phil: [85, 90] },
    u3: { math: [97, 99], prog: [90, 92], eng: [72, 80], db: [86, 88], phil: [78, 75] },
    u4: { math: [70, 86], prog: [66, 72], eng: [89, 94], db: [75, 80], phil: [96, 98] },
  },
  schedule: [
    { d: 0, s: '08:30', e: '10:00', sub: 'math', room: '305', type: 'Лекция' },
    { d: 0, s: '10:10', e: '11:40', sub: 'prog', room: 'Лаб. 2', type: 'Практика' },
    { d: 0, s: '12:20', e: '13:50', sub: 'eng', room: '212', type: 'Практика' },
    { d: 1, s: '10:10', e: '11:40', sub: 'db', room: 'Лаб. 4', type: 'Лабораторная' },
    { d: 1, s: '12:20', e: '13:50', sub: 'phil', room: '101', type: 'Лекция' },
    { d: 2, s: '08:30', e: '10:00', sub: 'prog', room: '307', type: 'Лекция' },
    { d: 2, s: '10:10', e: '11:40', sub: 'math', room: '305', type: 'Практика' },
    { d: 3, s: '08:30', e: '10:00', sub: 'db', room: '310', type: 'Лекция' },
    { d: 3, s: '10:10', e: '11:40', sub: 'eng', room: '212', type: 'Практика' },
    { d: 4, s: '10:10', e: '11:40', sub: 'phil', room: '101', type: 'Семинар' },
    { d: 4, s: '12:20', e: '13:50', sub: 'prog', room: 'Лаб. 2', type: 'Практика' },
  ],
  events: [
    { id: 'e1', date: iso(1), title: 'Хакатон Motion Web', place: 'Коворкинг, 2 этаж', tag: 'Хакатон' },
    { id: 'e2', date: iso(3), title: 'Дебаты: ИИ в образовании', place: 'Актовый зал', tag: 'Дебаты' },
    { id: 'e3', date: iso(5), title: 'Встреча Talking club', place: 'Библиотека, ауд. 12', tag: 'Клуб' },
    { id: 'e4', date: iso(8), title: 'Карьерный день', place: 'Главный холл', tag: 'Кампус' },
    { id: 'e5', date: iso(12), title: 'Олимпиада по математике', place: 'Ауд. 305', tag: 'Наука' },
  ],
  teams: [
    { id: 't1', title: 'Motion Web — команда', cat: 'Хакатон', leader: 'u1', members: ['u1', 'u4'], slots: 3, need: ['UI/UX', 'React', 'Pitch'], desc: 'Собираем команду на хакатон. Нужен дизайнер и тот, кто умеет презентовать.', hidden: false },
    { id: 't2', title: 'Speak Easy', cat: 'Talking club', leader: 'u2', members: ['u2'], slots: 6, need: ['English'], desc: 'Разговорный клуб: по четвергам говорим только по-английски. Уровень B1+.', hidden: false },
    { id: 't3', title: 'Матан без слёз', cat: 'Математика', leader: 'u3', members: ['u3', 'u4'], slots: 4, need: ['Math'], desc: 'Разбираем задачи, готовимся к зачёту и олимпиаде. Объясняю с нуля.', hidden: false },
    { id: 't4', title: 'Лига дебатов', cat: 'Дебаты', leader: 'u4', members: ['u4'], slots: 5, need: ['Debate', 'Public speaking'], desc: 'Тренируем аргументацию, формат British Parliamentary.', hidden: false },
  ],
  apps: [
    { id: 'ap1', team: 't1', user: 'u2', msg: 'Делаю интерфейсы в Figma, был опыт на двух хакатонах.', status: 'pending' },
    { id: 'ap2', team: 't3', user: 'u1', msg: 'Хочу закрыть матан на 80+, готов решать каждую неделю.', status: 'pending' },
  ],
  chat: {
    t1: [{ u: 'u1', t: 'Привет! Задача на хакатон — Pocket Money Hub. Кто что берёт?' }, { u: 'u4', t: 'Я возьму питч и презентацию.' }],
    t3: [{ u: 'u3', t: 'В среду в 16:00 разбираем пределы, ауд. 305.' }],
  },
  tasks: [
    { id: 'k1', title: 'Сдать лабораторную по базам данных', pts: 40, by: [] },
    { id: 'k2', title: 'Прийти на встречу Talking club', pts: 25, by: [] },
    { id: 'k3', title: 'Решить 10 задач по матанализу', pts: 60, by: [] },
    { id: 'k4', title: 'Помочь одногруппнику с кодом', pts: 30, by: [] },
  ],
})
