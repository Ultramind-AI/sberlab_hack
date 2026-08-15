import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// --- Swiper (Галерея) ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- НАСТРОЙКИ ---
const API_URL = '/api';
const MEDIA_URL = '';

// --- КОМПОНЕНТ: МОДАЛКА ЗАВЕРШЕНИЯ ПРОЕКТА (С ОЦЕНКАМИ) ---
const CompleteProjectModal = ({ project, isOpen, onClose, onSubmit }) => {
    if (!isOpen || !project) return null;

    // Берем только принятых студентов
    const students = project.students_info || [];

    const [reviews, setReviews] = useState({}); // { userId: { grade: 5, review: '' } }

    const handleChange = (uid, field, val) => {
        setReviews(prev => ({
            ...prev,
            [uid]: { ...prev[uid], [field]: val }
        }));
    };

    const handleSubmit = () => {
        const payload = Object.keys(reviews).map(uid => ({
            user_id: uid,
            grade: reviews[uid]?.grade || 5,
            review: reviews[uid]?.review || ''
        }));
        onSubmit(payload);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-window" onClick={e=>e.stopPropagation()}>
                <div className="modal-header">
                    <h3>🏁 Завершение проекта</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p>Оцените работу студентов перед закрытием проекта. Это пойдет в их портфолио.</p>

                    <div style={{display:'flex', flexDirection:'column', gap:15, margin:'20px 0'}}>
                        {students.map(s => (
                            <div key={s.id} className="card" style={{padding:15}}>
                                <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                                    <Avatar name={s.fio} url={s.avatar} />
                                    <b>{s.fio}</b>
                                </div>
                                <div style={{display:'flex', gap:20}}>
                                    <div>
                                        <label className="form-label">Оценка (1-5)</label>
                                        <select
                                            className="form-input"
                                            onChange={e => handleChange(s.id, 'grade', e.target.value)}
                                            defaultValue="5"
                                        >
                                            <option value="5">5 - Отлично</option>
                                            <option value="4">4 - Хорошо</option>
                                            <option value="3">3 - Нормально</option>
                                            <option value="2">2 - Плохо</option>
                                        </select>
                                    </div>
                                    <div style={{flex:1}}>
                                        <label className="form-label">Отзыв</label>
                                        <input
                                            className="form-input"
                                            placeholder="Коротко о работе студента..."
                                            onChange={e => handleChange(s.id, 'review', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {students.length === 0 && <p className="text-danger">В команде нет студентов!</p>}
                    </div>

                    <button className="btn-primary btn-full" onClick={handleSubmit}>Подтвердить и В Архив</button>
                </div>
            </div>
        </div>
    );
};

// --- КОМПОНЕНТ: HR DASHBOARD ---
const HRDashboard = ({ onShowProfile }) => {
    const [users, setUsers] = useState([]);
    const [filterStack, setFilterStack] = useState('');
    const [invited, setInvited] = useState({}); // Локальный стейт приглашений

    useEffect(() => {
        axios.get(`${API_URL}/users/`).then(res => setUsers(res.data.filter(u => u.role === 'student')));
    }, []);

    // Сортировка: GPA -> Кол-во проектов
    const filtered = users
        .filter(u => u.tech_stack.toLowerCase().includes(filterStack.toLowerCase()))
        .sort((a, b) => b.gpa - a.gpa);

    const handleInvite = (userId) => {
        // Имитация отправки оффера
        setInvited(prev => ({ ...prev, [userId]: true }));
        alert('Приглашение на собеседование отправлено студенту на почту и в Telegram!');
    };

    return (
        <div className="container fade-in" style={{marginTop: 40}}>
            <h1 className="page-title">💼 Кадровый резерв (HR)</h1>
            <p className="text-muted">Поиск лучших студентов для стажировок в СберЛаб</p>

            <div style={{marginBottom:20, display:'flex', gap:10, alignItems:'center'}}>
                <input
                    className="form-input"
                    placeholder="🔍 Фильтр по стеку (Python, Java, ML...)"
                    value={filterStack}
                    onChange={e => setFilterStack(e.target.value)}
                    style={{maxWidth: 400}}
                />
                <div style={{color:'#666', fontSize:14}}>Найдено кандидатов: <b>{filtered.length}</b></div>
            </div>

            <div className="grid">
                {filtered.map(u => (
                    <div key={u.id} className="card" style={{display:'flex', flexDirection:'column'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                            <div style={{display:'flex', gap:12, alignItems:'center', cursor:'pointer'}} onClick={() => onShowProfile(u)}>
                                <Avatar name={u.fio} url={u.avatar} size={56} />
                                <div>
                                    <b style={{fontSize:16}}>{u.fio}</b>
                                    <div style={{fontSize:13, color:'#666'}}>{u.group_number || 'Группа не указана'}</div>
                                </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <div style={{fontSize:20, fontWeight:'800', color: u.gpa >= 4.5 ? 'green' : '#374151'}}>{u.gpa}</div>
                                <div style={{fontSize:10, fontWeight:700, color:'#9CA3AF'}}>GPA</div>
                            </div>
                        </div>

                        <div style={{margin:'16px 0', flex:1}}>
                            <div style={{fontSize:12, color:'#6B7280', marginBottom:4, fontWeight:600}}>СТЕК ТЕХНОЛОГИЙ</div>
                            <div style={{fontSize:14}}>{u.tech_stack || '—'}</div>

                            <div style={{marginTop:12, display:'flex', gap:15}}>
                                <div>
                                    <span style={{fontSize:12, color:'#6B7280', fontWeight:600}}>ПРОЕКТЫ</span>
                                    <div style={{fontWeight:'bold'}}>{u.portfolio ? u.portfolio.length : 0}</div>
                                </div>
                                <div>
                                    <span style={{fontSize:12, color:'#6B7280', fontWeight:600}}>РЕЙТИНГ</span>
                                    {/* Считаем среднюю оценку */}
                                    <div style={{fontWeight:'bold', color:'orange'}}>
                                        ★ {u.portfolio && u.portfolio.length > 0
                                        ? (u.portfolio.reduce((acc, p) => acc + (p.grade || 0), 0) / u.portfolio.length).toFixed(1)
                                        : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:'auto'}}>
                            <button className="btn-secondary" style={{fontSize:13}} onClick={() => onShowProfile(u)}>
                                👤 Досье
                            </button>

                            {invited[u.id] ? (
                                <button className="btn-secondary" disabled style={{fontSize:13, background:'#DCFCE7', color:'#166534', borderColor:'transparent'}}>
                                    ✓ Приглашен
                                </button>
                            ) : (
                                <button className="btn-primary" style={{fontSize:13}} onClick={() => handleInvite(u.id)}>
                                    💌 Нанять
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Компонент Панели Преподавателя
const TeacherDashboard = ({ students, onVerify }) => {
    // Фильтруем только студентов и только неподтвержденных
    const pendingStudents = students.filter(u => u.role === 'student' && !u.is_verified);

    return (
        <div className="container fade-in" style={{marginTop: 40}}>
            <h1 className="page-title">Кабинет Деканата / Преподавателя</h1>
            <p className="text-secondary">Студентов на проверку: {pendingStudents.length}</p>

            <div className="grid">
                {pendingStudents.length === 0 && <p>Все студенты проверены! 🎉</p>}

                {pendingStudents.map(s => (
                    <div key={s.id} className="card">
                        <div style={{display:'flex', gap:15, alignItems:'center', marginBottom:15}}>
                            <Avatar name={s.fio} url={s.avatar} size={60} />
                            <div>
                                <h3 style={{margin:0}}>{s.fio}</h3>
                                <div style={{fontSize:14, color:'#666'}}>Группа: {s.group_number || 'Не указана'}</div>
                            </div>
                        </div>

                        <div style={{background:'#FEF2F2', padding:10, borderRadius:8, marginBottom:15, border:'1px solid #FECACA'}}>
                            <span style={{color:'#991B1B', fontWeight:'bold'}}>⚠️ Не подтвержден</span>
                        </div>

                        <div style={{marginBottom:15}}>
                            <label className="form-label">Заявленный средний балл:</label>
                            <input
                                className="form-input"
                                type="number"
                                step="0.1"
                                defaultValue={s.gpa}
                                id={`gpa-${s.id}`} // Чтобы найти значение при клике
                            />
                        </div>

                        <div style={{display:'flex', gap:10}}>
                            <button
                                className="btn-primary"
                                style={{width:'100%'}}
                                onClick={() => {
                                    const realGpa = document.getElementById(`gpa-${s.id}`).value;
                                    onVerify(s.id, realGpa);
                                }}
                            >
                                ✅ Подтвердить данные
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- КОМПОНЕНТ: АВАТАР ---
const Avatar = ({ name, url, size = 32, bg = 'var(--sber-green)' }) => {
    if (url) {
        const fullUrl = url.startsWith('http') ? url : `${MEDIA_URL}${url}`;
        return (
            <img
                src={fullUrl}
                alt={name}
                style={{
                    width: size, height: size, borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
            />
        );
    }
    const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
    return (
        <div className="avatar-circle" style={{
            width: size, height: size, background: bg, fontSize: size * 0.35,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', border: '2px solid white', color: 'white', fontWeight: 'bold'
        }} title={name}>
            {initials}
        </div>
    );
};

// --- КОМПОНЕНТ: ПРОСМОТР ЧУЖОГО ПРОФИЛЯ (МОДАЛКА) ---
const UserProfileModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
        <div className="modal-backdrop" onClick={onClose} style={{zIndex: 3000}}>
            <div className="modal-window" style={{ maxWidth: 800, height: 'auto', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Карточка участника</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>

                    {/* ВЕРХНЯЯ ЧАСТЬ: ИНФО */}
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center', minWidth: 120 }}>
                            <Avatar name={user.fio} url={user.avatar} size={120} />
                            <div className="badge" style={{ marginTop: 10, display: 'inline-block', fontSize: 12 }}>{user.role === 'student' ? 'Студент' : 'Ментор'}</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <h2 style={{ marginTop: 0, marginBottom: 10 }}>{user.fio}</h2>

                            {user.role === 'student' && (
                                <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
                                    <div style={{ background: '#F3F4F6', padding: '6px 12px', borderRadius: 8, fontSize: 13 }}>
                                        🎓 GPA: <b style={{ color: user.gpa >= 4.5 ? 'green' : 'black' }}>{user.gpa}</b>
                                    </div>
                                    <div style={{ background: '#F3F4F6', padding: '6px 12px', borderRadius: 8, fontSize: 13 }}>
                                        📚 Группа: <b>{user.group_number || '-'}</b>
                                    </div>
                                    {user.is_verified && (
                                        <div style={{ background: '#DCFCE7', color: '#166534', padding: '6px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            ✅ Данные подтверждены ВУЗом
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                {user.resume && <a href={user.resume} target="_blank" className="btn-secondary" style={{ fontSize: 13 }}>📄 Скачать Резюме</a>}
                                {user.telegram && <a href={`https://t.me/${user.telegram.replace('@', '')}`} target="_blank" className="btn-secondary" style={{ fontSize: 13 }}>✈️ Telegram</a>}
                                {user.github && <a href={user.github} target="_blank" className="btn-secondary" style={{ fontSize: 13 }}>👾 GitHub</a>}
                            </div>

                            <div>
                                <label className="mentor-label">Стек технологий</label>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>{user.tech_stack || 'Не указан'}</div>
                            </div>
                        </div>
                    </div>

                    {/* НИЖНЯЯ ЧАСТЬ: ИСТОРИЯ ПРОЕКТОВ (ПОРТФОЛИО) */}
                    {user.role === 'student' && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
                            <h3 style={{ marginBottom: 15 }}>📂 Портфолио проектов</h3>

                            {user.portfolio && user.portfolio.length > 0 ? (
                                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15 }}>
                                    {user.portfolio.map(p => (
                                        <div key={p.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, background: '#F9FAFB' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span className={`status-badge ${p.status}`}>
                                                    {p.status === 'done' ? 'Завершен' : p.status === 'in_progress' ? 'В работе' : 'Активен'}
                                                </span>
                                                {p.grade && <span style={{ fontWeight: 'bold', color: 'orange' }}>★ {p.grade}/5</span>}
                                            </div>

                                            <h4 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{p.title}</h4>

                                            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
                                                {p.tech_stack}
                                            </div>

                                            {p.review && (
                                                <div style={{ background: 'white', padding: 10, borderRadius: 8, fontSize: 13, fontStyle: 'italic', border: '1px solid #eee' }}>
                                                    " {p.review} "
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">Участия в проектах пока нет.</p>
                            )}
                        </div>
                    )}

                    {/* О СЕБЕ */}
                    {user.about && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
                            <h3 style={{ marginBottom: 10 }}>О себе</h3>
                            <div className="rich-text-content ql-editor" style={{padding:0}} dangerouslySetInnerHTML={{ __html: user.about }} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// --- УЛУЧШЕННАЯ ПАНЕЛЬ МЕНТОРА (КАПИТАНСКАЯ РУБКА) ---
// --- УЛУЧШЕННАЯ ПАНЕЛЬ МЕНТОРА (КАПИТАНСКАЯ РУБКА) - FIXED & MOBILE OPTIMIZED ---
const MentorAdminPanel = ({ project, onUpdate }) => {
    const [resTitle, setResTitle] = useState('');
    const [resUrl, setResUrl] = useState('');

    // Статусы для прогресс-бара
    const steps = [
        { key: 'open', label: '1. Набор команды', icon: '📢' },
        { key: 'in_progress', label: '2. В работе', icon: '🔥' },
        { key: 'done', label: '3. Завершен', icon: '🏁' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === project.status);

    const changeStatus = async (newStatus) => {
        if (newStatus === 'in_progress' && (!project.students_info || project.students_info.length === 0)) {
            if (!confirm('Команда пуста! Точно начать работу?')) return;
        }
        try {
            const fd = new FormData();
            fd.append('status', newStatus);
            await axios.patch(`${API_URL}/projects/${project.id}/`, fd);
            onUpdate();
        } catch(e) { alert('Ошибка'); }
    };

    const addResource = async () => {
        if(!resTitle || !resUrl) return alert('Заполните поля');
        try {
            await axios.post(`${API_URL}/projects/${project.id}/add_resource/`, { title: resTitle, url: resUrl });
            setResTitle(''); setResUrl('');
            onUpdate();
            alert('Ресурс добавлен');
        } catch(e) { alert('Ошибка'); }
    };

    return (
        <div style={{ background: '#fff', borderRadius: 16, marginTop: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {/* 1. ЗАГОЛОВОК И СТАТУС-БАР */}
            <div style={{ padding: '24px 24px 0 24px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    🛠 Панель управления
                </h3>

                {/* Visual Status Pipeline (Responsive) */}
                <div className="mentor-steps-wrapper" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, position: 'relative' }}>
                    {/* Линия фона */}
                    <div className="mentor-steps-line" style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 4, background: '#F3F4F6', zIndex: 0 }}></div>

                    {steps.map((step, index) => {
                        const isActive = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        return (
                            <div key={step.key} className="mentor-step-item" style={{ zIndex: 1, textAlign: 'center', opacity: isActive ? 1 : 0.5 }}>
                                <div className="mentor-step-circle" style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: isActive ? (isCurrent ? 'var(--sber-green)' : '#10B981') : '#E5E7EB',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto', fontSize: 18, border: isCurrent ? '4px solid #D1FAE5' : 'none',
                                    transition: 'all 0.3s', flexShrink: 0
                                }}>
                                    {isActive ? '✓' : index + 1}
                                </div>
                                <div className="mentor-step-label" style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: isActive ? '#1F2937' : '#9CA3AF' }}>{step.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. КОНТЕНТ (Сетка responsive-col-2) */}
            <div className="responsive-col-2" style={{ padding: 24, borderTop: '1px solid #F3F4F6', marginTop: 24 }}>

                {/* БЛОК 1: ДЕЙСТВИЯ (Теперь идет первым, чтобы на мобильном был сверху) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <h4 style={{marginTop:0}}>⚡️ Действия</h4>

                    {project.status === 'open' && (
                        <button className="btn-primary" onClick={() => changeStatus('in_progress')} style={{ justifyContent: 'center', padding: 16 }}>
                            🚀 <b>Запустить проект</b>
                            <div style={{fontSize:11, fontWeight:400, opacity:0.8}}>Закрыть набор и начать</div>
                        </button>
                    )}

                    {project.status === 'in_progress' && (
                        <div style={{background:'#ECFDF5', padding:15, borderRadius:10, border:'1px solid #A7F3D0', textAlign:'center'}}>
                            <div style={{color:'#065F46', fontWeight:'bold', marginBottom:10}}>Проект в работе</div>
                            <button className="btn-primary" style={{width:'100%', background:'#059669'}} onClick={() => changeStatus('done')}>
                                🏁 Завершить и оценить
                            </button>
                        </div>
                    )}

                    {project.status === 'done' && (
                        <div style={{background:'#F3F4F6', padding:15, borderRadius:10, textAlign:'center'}}>
                            <div style={{color:'#6B7280', marginBottom:10}}>В архиве</div>
                            <button className="btn-secondary" onClick={() => changeStatus('open')} style={{width:'100%'}}>♻️ Вернуть в работу</button>
                        </div>
                    )}

                    {/* КНОПКА АРХИВА (Вернул на место) */}
                    {project.status !== 'done' && (
                        <button className="btn-danger-outline" style={{marginTop:'auto', textAlign:'center'}} onClick={() => changeStatus('done')}>
                            📂 Убрать в черновики (Архив)
                        </button>
                    )}
                </div>

                {/* БЛОК 2: РЕСУРСЫ (На мобильном будет вторым) */}
                <div>
                    <h4 style={{marginTop:0}}>🔐 Доступы и Ресурсы</h4>
                    <p className="text-muted" style={{fontSize:13}}>Ссылки для команды (Git, Jira, Drive).</p>

                    <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:15}}>
                        {project.resources?.map(r => (
                            <div key={r.id} style={{background:'#F3F4F6', padding:'4px 10px', borderRadius:6, fontSize:12, display:'flex', alignItems:'center', gap:5}}>
                                🔗 <a href={r.url} target="_blank" style={{color:'#374151', fontWeight:600}}>{r.title}</a>
                            </div>
                        ))}
                    </div>

                    <div style={{background: '#F9FAFB', padding: 15, borderRadius: 10}}>
                        <div style={{display:'flex', flexDirection:'column', gap:10}}>
                            <input className="form-input" style={{fontSize:13, padding:8}} placeholder="Название (GitLab)" value={resTitle} onChange={e => setResTitle(e.target.value)} />
                            <div style={{display:'flex', gap:5}}>
                                <input className="form-input" style={{fontSize:13, padding:8}} placeholder="URL..." value={resUrl} onChange={e => setResUrl(e.target.value)} />
                                <button className="btn-secondary" onClick={addResource} style={{padding:'0 15px'}}>ok</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {project.is_diploma_allowed && (
                <div style={{background:'#EFF6FF', padding:'10px 24px', borderTop:'1px solid #BFDBFE', color:'#1E40AF', fontSize:13}}>
                    🎓 Дипломный проект
                </div>
            )}
        </div>
    );
};

// --- УПРАВЛЕНИЕ КОМАНДОЙ + AI ANALYSIS ---
const CandidatesManager = ({ projectId, onShowProfile, maxStudents }) => {
    const [candidates, setCandidates] = useState([]);

    // Новые стейты для AI
    const [aiResults, setAiResults] = useState(null); // { id: { score: 95, reason: "..." } }
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fetchCandidates = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects/${projectId}/candidates/`);
            setCandidates(res.data);
            setAiResults(null); // Сбрасываем анализ при обновлении данных
        } catch (e) { console.error(e); }
    };

    useEffect(() => { if (projectId) fetchCandidates(); }, [projectId]);

    const handleDecision = async (partId, action) => {
        try {
            await axios.post(`${API_URL}/projects/${projectId}/manage_candidate/${partId}/`, { action });
            fetchCandidates();
        } catch (e) { alert('Ошибка'); }
    };

    const handleKick = async (userId) => {
        if(!confirm('Удалить студента?')) return;
        try {
            await axios.post(`${API_URL}/projects/${projectId}/kick_student/`, { student_id: userId });
            fetchCandidates();
        } catch (e) { alert('Ошибка'); }
    };

    // ФУНКЦИЯ ЗАПУСКА АНАЛИЗА
    const runAiAnalysis = async () => {
        if (pending.length === 0) return alert('Нет новых заявок для анализа');
        setIsAnalyzing(true);
        try {
            const res = await axios.post(`${API_URL}/projects/${projectId}/analyze_candidates/`);
            // Превращаем массив [{id, score, reason}] в объект {id: {score, reason}} для быстрого доступа
            const resultsMap = {};
            res.data.forEach(item => {
                resultsMap[item.id] = item;
            });
            setAiResults(resultsMap);
        } catch (e) {
            console.error(e);
            alert('Ошибка AI анализа');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const pending = candidates.filter(c => c.status === 'pending');
    const team = candidates.filter(c => c.status === 'accepted');

    // Если есть AI результаты, сортируем заявки по score
    const displayedPending = aiResults
        ? [...pending].sort((a, b) => (aiResults[b.id]?.score || 0) - (aiResults[a.id]?.score || 0))
        : pending;

    // Генерируем слоты команды
    const slots = [];
    for (let i = 0; i < maxStudents; i++) {
        if (i < team.length) slots.push({ type: 'user', data: team[i] });
        else slots.push({ type: 'empty' });
    }

    return (
        <div style={{marginTop: 40}}>
            <h3 className="section-title">👥 Состав команды ({team.length}/{maxStudents})</h3>

            {/* СЛОТЫ (Лобби) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 15, marginBottom: 40 }}>
                {slots.map((slot, i) => (
                    <div key={i} style={{
                        height: 180, borderRadius: 12,
                        border: slot.type === 'empty' ? '2px dashed #E5E7EB' : '1px solid #E5E7EB',
                        background: slot.type === 'empty' ? '#F9FAFB' : '#fff',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', boxShadow: slot.type === 'user' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                    }}>
                        {slot.type === 'empty' ? (
                            <div style={{color:'#9CA3AF', textAlign:'center'}}>
                                <div style={{fontSize:24, marginBottom:5}}>◌</div>
                                <div style={{fontSize:13, fontWeight:600}}>Свободное место</div>
                            </div>
                        ) : (
                            <>
                                <div style={{position:'absolute', top:10, right:10, cursor:'pointer', color:'#EF4444'}} onClick={()=>handleKick(slot.data.user.id)}>✕</div>
                                <div onClick={()=>onShowProfile(slot.data.user)} style={{cursor:'pointer', textAlign:'center'}}>
                                    <Avatar name={slot.data.user.fio} url={slot.data.user.avatar} size={64} />
                                    <div style={{fontWeight:'bold', marginTop:10, fontSize:14}}>{slot.data.user.fio.split(' ')[0]}</div>
                                    <div style={{fontSize:11, background:'#F3F4F6', padding:'2px 8px', borderRadius:10, marginTop:5, display:'inline-block'}}>
                                        GPA: {slot.data.user.gpa}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* ЗАЯВКИ + AI КНОПКА */}
            {pending.length > 0 && (
                <div style={{background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:16, padding:24}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                        <h3 style={{marginTop:0, color:'#9A3412', display:'flex', alignItems:'center', gap:10}}>
                            📬 Входящие заявки <span className="badge" style={{background:'#C2410C', color:'white'}}>{pending.length}</span>
                        </h3>

                        {/* КНОПКА AI */}
                        <button
                            className="btn-primary"
                            style={{background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border:'none', boxShadow:'0 4px 15px rgba(168, 85, 247, 0.4)'}}
                            onClick={runAiAnalysis}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? 'Думаю...' : '🤖 AI Анализ кандидатов'}
                        </button>
                    </div>

                    <div style={{display:'flex', flexDirection:'column', gap:10}}>
                        {displayedPending.map(c => {
                            const aiData = aiResults ? aiResults[c.id] : null;
                            return (
                                <div key={c.id} style={{background:'white', padding:15, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'start', boxShadow:'0 2px 4px rgba(0,0,0,0.02)', border: aiData && aiData.score > 80 ? '2px solid #86EFAC' : '1px solid #eee'}}>
                                    <div style={{display:'flex', gap:15, flex:1}}>
                                        <div onClick={()=>onShowProfile(c.user)} style={{cursor:'pointer'}}>
                                            <Avatar name={c.user.fio} url={c.user.avatar} size={48} />
                                            {/* AI SCORE BADGE */}
                                            {aiData && (
                                                <div style={{
                                                    marginTop:5, textAlign:'center', fontWeight:'bold', fontSize:12,
                                                    background: aiData.score > 75 ? '#DCFCE7' : aiData.score > 40 ? '#FEF9C3' : '#FEE2E2',
                                                    color: aiData.score > 75 ? '#166534' : aiData.score > 40 ? '#854D0E' : '#991B1B',
                                                    padding:'2px 0', borderRadius:4
                                                }}>
                                                    {aiData.score}%
                                                </div>
                                            )}
                                        </div>
                                        <div style={{flex:1}}>
                                            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                                                <b onClick={()=>onShowProfile(c.user)} style={{cursor:'pointer', fontSize:16}}>{c.user.fio}</b>
                                                {c.is_diploma_request && <span className="badge" style={{background:'#DBEAFE', color:'#1E40AF', fontSize:10}}>🎓 Диплом</span>}
                                                {aiData && <span style={{fontSize:11, color:'#6B7280'}}>✨ AI Рекомендация</span>}
                                            </div>

                                            <div style={{fontSize:13, color:'#666', marginTop:2}}>GPA: <b>{c.user.gpa}</b> • {c.user.tech_stack}</div>

                                            <div style={{background:'#F9FAFB', padding:'8px 12px', borderRadius:8, marginTop:8, fontSize:13, fontStyle:'italic', color:'#4B5563'}}>
                                                "{c.cover_letter}"
                                            </div>

                                            {/* AI REASON BLOCK */}
                                            {aiData && (
                                                <div style={{marginTop:8, fontSize:13, color:'#4B5563', background: '#F0FDFA', padding: 8, borderRadius: 6, border: '1px solid #CCFBF1', display:'flex', gap:5}}>
                                                    <span>🤖</span> <span>{aiData.reason}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{display:'flex', flexDirection:'column', gap:8, marginLeft:10}}>
                                        <button className="btn-primary" style={{fontSize:13, padding:'6px 15px'}} onClick={() => handleDecision(c.id, 'accept')}>Принять</button>
                                        <button className="btn-secondary" style={{fontSize:13, color:'red', borderColor:'#FECACA', background:'white'}} onClick={() => handleDecision(c.id, 'reject')}>Отказать</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- КОМПОНЕНТ: МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ПРОЕКТА (ОБНОВЛЕННАЯ С NDA) ---
const ProjectEditorModal = ({ isOpen, onClose, onSubmit, isAiLoading, handleAiGenerate }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        full_description: '',
        tech_stack: '',
        max_students: 3,
        complexity: 'medium',
        urgency: 'medium',
        deadline: '',
        is_nda_required: false,
        is_diploma_allowed: false
    });

    const [aiPrompt, setAiPrompt] = useState('');
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(prev => [...prev, ...filesArray]);
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const onAiClick = async () => {
        const data = await handleAiGenerate(aiPrompt);
        if (data) {
            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                description: data.description || prev.description,
                full_description: data.full_description || prev.full_description,
                tech_stack: data.tech_stack || prev.tech_stack,
                complexity: data.complexity || prev.complexity,
                urgency: data.urgency || prev.urgency,
                max_students: data.max_students || prev.max_students
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = new FormData();
        Object.keys(formData).forEach(key => {
            payload.append(key, formData[key] || '');
        });
        images.forEach(img => {
            payload.append('uploaded_images', img);
        });
        onSubmit(payload);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-window" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Новый проект</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* БЛОК AI */}
                    <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: 20, borderRadius: 16, marginBottom: 24, border: '1px solid #bbf7d0' }}>
                        <label className="form-label" style={{ color: '#166534' }}>✨ GigaChat Assistant</label>
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            <input
                                className="form-input"
                                placeholder="Опиши идею (например: 'Приложение для обмена книгами в вузе')"
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                style={{ borderColor: '#86efac' }}
                            />
                            <button
                                type="button"
                                onClick={onAiClick}
                                className="btn-primary"
                                disabled={isAiLoading}
                                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                {isAiLoading ? 'Думаю...' : '🪄 Заполнить'}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="row-2-col">
                            <div style={{ flex: 3 }}>
                                <label className="form-label">Название</label>
                                <input
                                    className="form-input"
                                    required
                                    value={formData.title}
                                    onChange={e => handleChange('title', e.target.value)}
                                    placeholder="Название проекта"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Дедлайн</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.deadline}
                                    onChange={e => handleChange('deadline', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* НОВЫЕ ЧЕКБОКСЫ */}
                        <div style={{background: '#f3f4f6', padding: 15, borderRadius: 10, display: 'flex', gap: 20, flexWrap: 'wrap'}}>
                            <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_nda_required}
                                    onChange={e => handleChange('is_nda_required', e.target.checked)}
                                />
                                🔒 Требуется NDA
                            </label>
                            <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_diploma_allowed}
                                    onChange={e => handleChange('is_diploma_allowed', e.target.checked)}
                                />
                                🎓 Можно как диплом
                            </label>
                        </div>

                        <div className="row-2-col">
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Срочность</label>
                                <select className="form-input" value={formData.urgency} onChange={e => handleChange('urgency', e.target.value)}>
                                    <option value="low">Спокойно</option>
                                    <option value="medium">Срочно</option>
                                    <option value="high">🔥 Горит</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Сложность</label>
                                <select className="form-input" value={formData.complexity} onChange={e => handleChange('complexity', e.target.value)}>
                                    <option value="easy">Легко</option>
                                    <option value="medium">Средне</option>
                                    <option value="hard">Сложно</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Мест</label>
                                <input type="number" className="form-input" value={formData.max_students} onChange={e => handleChange('max_students', e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Стек технологий</label>
                            <input className="form-input" value={formData.tech_stack} onChange={e => handleChange('tech_stack', e.target.value)} placeholder="Python, React, AI..." />
                        </div>

                        <div>
                            <label className="form-label">Краткое описание</label>
                            <textarea className="form-input form-textarea" rows="2" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                        </div>

                        {/* RICH TEXT EDITOR */}
                        <div>
                            <label className="form-label">Полное ТЗ</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.full_description}
                                onChange={(val) => handleChange('full_description', val)}
                                modules={quillModules}
                                placeholder="Опишите задачу подробно..."
                            />
                        </div>

                        {/* ЗАГРУЗКА КАРТИНОК */}
                        <div>
                            <label className="form-label">Галерея</label>
                            <div className="image-upload-area" onClick={() => document.getElementById('file-upload').click()}>
                                📁 Нажмите, чтобы добавить фото
                                <input id="file-upload" type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                            </div>
                            <div className="preview-grid">
                                {previews.map((src, i) => (
                                    <div key={i} className="preview-item">
                                        <img src={src} alt="preview" />
                                        <button type="button" className="remove-img" onClick={() => removeImage(i)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
                            <button type="submit" className="btn-primary" style={{ paddingLeft: 40, paddingRight: 40 }}>Опубликовать</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- МОДАЛКА ПОДАЧИ ЗАЯВКИ (СТУДЕНТ) ---
const ApplicationModal = ({ isOpen, onClose, onSubmit }) => {
    if (!isOpen) return null;
    const [coverLetter, setCoverLetter] = useState('');
    const [isDiploma, setIsDiploma] = useState(false);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-window" style={{maxWidth: 500, height: 'auto'}} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Подача заявки</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <label className="form-label">Почему вы хотите в этот проект?</label>
                    <textarea
                        className="form-input form-textarea"
                        rows="4"
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        placeholder="Опишите свой опыт и мотивацию..."
                    />

                    <label style={{display:'flex', alignItems:'center', gap:10, marginTop:15, cursor:'pointer'}}>
                        <input type="checkbox" checked={isDiploma} onChange={e => setIsDiploma(e.target.checked)} />
                        <span>Планирую писать диплом по этой теме</span>
                    </label>

                    <button className="btn-primary btn-full" style={{marginTop: 20}} onClick={() => onSubmit(coverLetter, isDiploma)}>
                        Отправить заявку
                    </button>
                </div>
            </div>
        </div>
    );
};

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = ({ projects, users }) => {
    // 1. Подготовка данных: Статусы проектов
    const statusData = [
        { name: 'Набор открыт', value: projects.filter(p => p.status === 'open').length, color: '#10B981' },
        { name: 'В работе', value: projects.filter(p => p.status === 'in_progress').length, color: '#F59E0B' },
        { name: 'Завершены', value: projects.filter(p => p.status === 'done').length, color: '#3B82F6' },
    ];

    // 2. Подготовка данных: Топ технологий
    const techCount = {};
    projects.forEach(p => {
        if (!p.tech_stack) return;
        // Разбиваем строку "Python, React, AI" на массив, чистим и считаем
        p.tech_stack.split(',').forEach(t => {
            const tag = t.trim();
            if (tag) techCount[tag] = (techCount[tag] || 0) + 1;
        });
    });

    // Превращаем в массив и берем Топ-5
    const techData = Object.keys(techCount)
        .map(key => ({ name: key, value: techCount[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // 3. KPI Метрики
    const totalStudents = users.filter(u => u.role === 'student').length;
    const activeProjects = projects.filter(p => p.status !== 'done').length;
    const avgTeamSize = projects.length ? (projects.reduce((acc, p) => acc + (p.students_info?.length || 0), 0) / projects.length).toFixed(1) : 0;

    return (
        <div className="container fade-in" style={{ marginTop: 40 }}>
            <h1 className="page-title">📊 Аналитика СберЛаб</h1>
            <p className="text-muted">Дашборд эффективности лаборатории</p>

            {/* KPI CARDS */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: 36, fontWeight: 'bold', color: 'var(--sber-green)' }}>{projects.length}</div>
                    <div style={{ color: '#6B7280', fontSize: 14, fontWeight: 600 }}>Всего проектов</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: 36, fontWeight: 'bold', color: '#3B82F6' }}>{totalStudents}</div>
                    <div style={{ color: '#6B7280', fontSize: 14, fontWeight: 600 }}>Студентов в базе</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: 36, fontWeight: 'bold', color: '#F59E0B' }}>{avgTeamSize}</div>
                    <div style={{ color: '#6B7280', fontSize: 14, fontWeight: 600 }}>Ср. размер команды</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: 36, fontWeight: 'bold', color: '#EF4444' }}>{activeProjects}</div>
                    <div style={{ color: '#6B7280', fontSize: 14, fontWeight: 600 }}>Активных задач</div>
                </div>
            </div>

            {/* CHARTS */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 30 }}>

                {/* График 1: Статусы */}
                <div className="card" style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: 20 }}>Воронка проектов</h3>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip
                                    contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                />
                                <Bar dataKey="value" name="Количество" radius={[4, 4, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* График 2: Технологии */}
                <div className="card" style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: 20 }}>Топ-5 Технологий (Спрос)</h3>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={techData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {techData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

function App() {
    // --- STATE: AUTH ---
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState({
        id: localStorage.getItem('userId'),
        role: localStorage.getItem('userRole'),
        fio: '...'
    });

    // --- STATE: UI & DATA ---
    const [view, setView] = useState('all'); // 'all', 'my', 'profile', 'teacher', 'hr', 'archive'
    const [projects, setProjects] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [viewedUser, setViewedUser] = useState(null); // Кого смотрим в профиле

    // Модалки и формы
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedProjectForCompletion, setSelectedProjectForCompletion] = useState(null);

    // Вход
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    // Профиль аватар
    const [avatarFile, setAvatarFile] = useState(null);

    // AI State (передается в модалку)
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Регистрация
    const [isRegistering, setIsRegistering] = useState(false);
    const [regData, setRegData] = useState({
        username: '', password: '', fio: '', role: 'student', group_number: '', gpa: ''
    });

    // Axios Config
    if (token) axios.defaults.headers.common['Authorization'] = `Token ${token}`;

    // --- FETCH DATA ---
    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects/`);
            let data = res.data;

            if (view === 'my') {
                data = data.filter(p => {
                    // 1. Я Создатель?
                    if (p.creator && p.creator.id == user.id) return true;
                    // 2. Я Ментор (в списке менторов)?
                    if (p.mentors && p.mentors.some(m => m.id == user.id)) return true;
                    // 3. Я Студент (есть статус участия)?
                    if (p.my_status !== null) return true;

                    return false;
                }).reverse();
            } else {
                data.sort((a, b) => {
                    if (b.match_score !== a.match_score) return b.match_score - a.match_score;
                    return new Date(b.created_at) - new Date(a.created_at);
                });
            }
            setProjects(data);
        } catch (e) { console.error(e); }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/users/${user.id}/`);
            setProfileData(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users/`);
            setAllUsers(res.data);
        } catch(e) { console.error(e); }
    };

    useEffect(() => {
        if (view === 'analytics') fetchUsers();
        if (token) {
            if (view === 'profile') {
                fetchProfile();
            } else if (view === 'teacher' || view === 'hr') {
                fetchUsers();
            } else {
                fetchProjects();
                setSelectedProject(null);
            }

            if (user.role === 'teacher' || user.role === 'hr') {
                fetchUsers();
            }
        }
    }, [token, view, user.role]);

    // --- ACTIONS ---

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}-token-auth/`, loginData);
            const { token, role, user_id, fio } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('userId', user_id);
            setToken(token);
            setUser({ id: user_id, role, fio });
            window.location.reload();
        } catch (err) { alert('Ошибка входа'); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/register/`, regData);
            alert('Регистрация успешна! Теперь войдите.');
            setLoginData({ username: regData.username, password: regData.password });
            setIsRegistering(false);
        } catch (err) {
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Ошибка регистрации';
            alert(errorMsg);
        }
    };

    const handleVerifyStudent = async (studentId, gpa) => {
        try {
            await axios.post(`${API_URL}/users/${studentId}/verify_student/`, { gpa });
            alert('Студент верифицирован');
            fetchUsers();
        } catch (e) {
            alert('Ошибка');
        }
    };

    const handleAiGenerateLogic = async (prompt) => {
        if (!prompt.trim()) {
            alert('Введите идею проекта');
            return null;
        }
        setIsAiLoading(true);
        try {
            const res = await axios.post(`${API_URL}/projects/generate_ai/`, { prompt });
            return res.data;
        } catch (err) {
            console.error(err);
            alert('Ошибка генерации');
            return null;
        } finally {
            setIsAiLoading(false);
        }
    };
    const handleShowProfile = (user) => {
        setViewedUser(user);
    };
    const handleCreateProject = async (formDataPayload) => {
        try {
            await axios.post(`${API_URL}/projects/`, formDataPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsCreateModalOpen(false);
            fetchProjects();
        } catch (err) {
            alert('Ошибка создания проекта');
            console.error(err);
        }
    };

    const handleCompleteProject = async (reviews) => {
        try {
            // Отправляем оценки
            await axios.post(`${API_URL}/projects/${selectedProjectForCompletion.id}/complete/`, {
                reviews: reviews
            });

            // Обновляем статус проекта в архив
            await axios.patch(`${API_URL}/projects/${selectedProjectForCompletion.id}/`, {
                status: 'done'
            });

            setIsCompleteModalOpen(false);
            setSelectedProjectForCompletion(null);

            // Обновляем данные
            if (selectedProject) {
                const res = await axios.get(`${API_URL}/projects/${selectedProject.id}/`);
                setSelectedProject(res.data);
            }
            fetchProjects();

            alert('Проект завершен с оценками!');
        } catch (err) {
            console.error(err);
            alert('Ошибка при завершении проекта');
        }
    };

    // --- ЛОГИКА ЗАЯВОК ---
    const handleApply = async (coverLetter, isDiploma) => {
        try {
            await axios.post(`${API_URL}/projects/${selectedProject.id}/apply/`, {
                cover_letter: coverLetter,
                is_diploma: isDiploma
            });
            setIsApplyModalOpen(false);
            alert('Заявка отправлена!');
            const res = await axios.get(`${API_URL}/projects/${selectedProject.id}/`);
            setSelectedProject(res.data);
        } catch (e) { alert(e.response?.data?.error || 'Ошибка'); }
    };

    const handleSignNDA = async () => {
        if(!confirm('Подтверждаете, что вы ознакомились с NDA?')) return;
        try {
            await axios.post(`${API_URL}/projects/${selectedProject.id}/sign_nda/`);
            const res = await axios.get(`${API_URL}/projects/${selectedProject.id}/`);
            setSelectedProject(res.data);
            alert('NDA Подписан! Доступы открыты.');
        } catch (e) { alert('Ошибка'); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('fio', profileData.fio);
        fd.append('about', profileData.about);
        fd.append('tech_stack', profileData.tech_stack);
        fd.append('telegram', profileData.telegram);
        fd.append('github', profileData.github);

        if (avatarFile) fd.append('avatar', avatarFile);
        if (profileData.resumeFile) fd.append('resume', profileData.resumeFile);

        try {
            await axios.patch(`${API_URL}/users/${user.id}/`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsEditingProfile(false);
            fetchProfile();
            alert('Профиль обновлен!');
        } catch (e) {
            console.error(e);
            alert('Ошибка сохранения');
        }
    };

    // --- UTILS ---
    const getComplexityLabel = (c) => ({ easy: '🟢 Легкий', medium: '🟡 Средний', hard: '🔴 Сложный' }[c] || c);
    const getUrgencyLabel = (u) => ({ low: 'Спокойно', medium: 'Срочно', high: '🔥 Горит' }[u] || u);

    // Логика фильтрации проектов для отображения
    const getDisplayedProjects = () => {
        // 1. АРХИВ (Только завершенные и где я ментор/создатель)
        if (view === 'archive') {
            return projects.filter(p =>
                p.status === 'done' &&
                (p.creator?.id == user.id || p.mentors?.some(m => m.id == user.id))
            );
        }

        // 2. МОИ ПРОЕКТЫ (Активные, где я как-то участвую)
        if (view === 'my') {
            return projects.filter(p => {
                if (p.status === 'done') return false; // Убираем архивные

                const isCreator = p.creator?.id == user.id;
                const isMentor = p.mentors?.some(m => m.id == user.id);
                const isParticipant = p.my_status !== null; // 'pending', 'accepted' и т.д.

                return isCreator || isMentor || isParticipant;
            });
        }

        // 3. ВИТРИНА (Все активные)
        return projects.filter(p => p.status !== 'done');
    };

    const displayedProjects = getDisplayedProjects();

    const ProjectComments = ({ project, onUpdate }) => {
        const [text, setText] = useState('');

        const sendComment = async () => {
            if (!text.trim()) return;
            try {
                await axios.post(`${API_URL}/projects/${project.id}/add_comment/`, { text });
                setText('');
                onUpdate(); // Перезагружаем проект, чтобы увидеть новый коммент
            } catch (e) { alert('Ошибка отправки'); }
        };

        return (
            <div style={{ marginTop: 40, background: '#FAFAFA', padding: 25, borderRadius: 12 }}>
                <h3>💬 Вопросы ментору</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 20 }}>
                    {project.comments.map(c => (
                        <div key={c.id} style={{ background: '#fff', padding: 15, borderRadius: 8, border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 5 }}>
                                <Avatar name={c.author.fio} url={c.author.avatar} size={24} />
                                <b>{c.author.fio}</b>
                                <span style={{ fontSize: 12, color: '#999' }}>{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <div>{c.text}</div>
                        </div>
                    ))}
                    {project.comments.length === 0 && <p className="text-muted">Пока нет вопросов. Будьте первым!</p>}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        className="form-input"
                        placeholder="Уточните детали перед подачей заявки..."
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendComment()}
                    />
                    <button className="btn-primary" onClick={sendComment}>Отправить</button>
                </div>
            </div>
        );
    };

    // --- РЕНДЕР ДЕТАЛЬНОЙ СТРАНИЦЫ ПРОЕКТА ---
    const renderProjectDetail = () => {
        if (!selectedProject) return null;

        // Определяем статус пользователя
        const isCreator = selectedProject.creator?.id == user.id;
        const isMentor = selectedProject.mentors?.some(m => m.id == user.id) || isCreator;
        const myStatus = selectedProject.my_status; // 'pending', 'accepted', 'rejected', null

        return (
            <div className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
                {/* МОДАЛКА ПРОФИЛЯ */}
                <UserProfileModal user={viewedUser} onClose={()=>setViewedUser(null)} />

                {/* МОДАЛКА ЗАВЕРШЕНИЯ ПРОЕКТА */}
                <CompleteProjectModal
                    project={selectedProjectForCompletion}
                    isOpen={isCompleteModalOpen}
                    onClose={() => {
                        setIsCompleteModalOpen(false);
                        setSelectedProjectForCompletion(null);
                    }}
                    onSubmit={handleCompleteProject}
                />

                <button onClick={() => {setSelectedProject(null); fetchProjects();}} className="btn-back">← Назад</button>
                <div className="project-detail-card">
                    {/* ГАЛЕРЕЯ */}
                    <div className="swiper-container-wrapper">
                        {selectedProject.images && selectedProject.images.length > 0 ? (
                            <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} className="project-swiper">
                                {selectedProject.images.map(img => (
                                    <SwiperSlide key={img.id} className="swiper-slide-custom">
                                        <div className="slide-image-container">
                                            <img src={img.image.startsWith('http') ? img.image : `${MEDIA_URL}${img.image}`} alt="slide" />
                                            <div className="slide-blur-bg" style={{ backgroundImage: `url(${img.image})` }}></div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        ) : <div className="no-image-placeholder"><span>📸 Нет изображений</span></div>}
                    </div>

                    {/* КОНТЕНТ */}
                    <div className="detail-content">
                        <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
                            {selectedProject.is_nda_required && <span className="badge" style={{background:'#FEE2E2', color:'#991B1B'}}>🔒 NDA Required</span>}
                            {selectedProject.is_diploma_allowed && <span className="badge" style={{background:'#DBEAFE', color:'#1E40AF'}}>🎓 Диплом</span>}
                            <span className={`badge complexity-${selectedProject.complexity}`}>{getComplexityLabel(selectedProject.complexity)}</span>
                            <span className={`badge urgency-${selectedProject.urgency}`}>{getUrgencyLabel(selectedProject.urgency)}</span>
                            {selectedProject.match_score > 0 && user.role === 'student' && <span className="ai-match">Match {selectedProject.match_score}%</span>}
                        </div>

                        <h1 className="detail-title">{selectedProject.title}</h1>

                        {/* --- МЕНТОРЫ ПРОЕКТА (КЛИКАБЕЛЬНЫЕ) --- */}
                        <div style={{display:'flex', gap:15, margin:'20px 0'}}>
                            <div style={{display:'flex', alignItems:'center', gap:10}}>
                                <span className="text-muted">Ментор:</span>
                                <div style={{cursor:'pointer', display:'flex', alignItems:'center', gap:5}} onClick={()=>setViewedUser(selectedProject.creator)}>
                                    <Avatar name={selectedProject.creator.fio} url={selectedProject.creator.avatar} size={32} />
                                    <b>{selectedProject.creator.fio}</b>
                                </div>
                            </div>
                        </div>

                        <div className="tech-row">
                            {selectedProject.tech_stack?.split(',').map((t, i) => <span key={i} className="tech-tag">{t.trim()}</span>)}
                        </div>

                        {/* --- БЛОК ДЕЙСТВИЙ ДЛЯ СТУДЕНТА --- */}
                        {user.role === 'student' && (
                            <div style={{margin: '20px 0', padding: 20, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0'}}>
                                {!myStatus && (
                                    <>
                                        <h3>Хочешь в команду?</h3>
                                        <button className="btn-primary" onClick={() => setIsApplyModalOpen(true)}>Подать заявку</button>
                                    </>
                                )}
                                {myStatus === 'pending' && <h3 style={{color: '#D97706'}}>⏳ Ваша заявка на рассмотрении</h3>}
                                {myStatus === 'rejected' && <h3 style={{color: '#DC2626'}}>❌ Заявка отклонена</h3>}

                                {myStatus === 'accepted' && (
                                    <>
                                        <h3 style={{color: '#166534'}}>🎉 Вы в команде!</h3>
                                        {/* Проверка NDA */}
                                        {selectedProject.is_nda_required && !selectedProject.can_see_resources && (
                                            <div style={{marginTop: 10, background: '#FFF7ED', padding: 15, borderRadius: 8, border: '1px solid #FED7AA'}}>
                                                <p>⚠️ Чтобы получить доступ к репозиторию и задачам, необходимо подписать NDA.</p>
                                                <button className="btn-primary" style={{background: '#EA580C'}} onClick={handleSignNDA}>✍️ Подписать NDA</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* --- БЛОК РЕСУРСОВ (ССЫЛКИ) --- */}
                        {selectedProject.can_see_resources && selectedProject.resources && selectedProject.resources.length > 0 && (
                            <div style={{marginBottom: 30}}>
                                <h3 className="section-title">🔐 Ресурсы проекта</h3>
                                <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'}}>
                                    {selectedProject.resources.map(r => (
                                        <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="card" style={{textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:15}}>
                                            <span style={{fontSize:24}}>🔗</span>
                                            <span style={{fontWeight:'bold', color:'var(--text-primary)'}}>{r.title}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- УПРАВЛЕНИЕ КОМАНДОЙ И ПРОЕКТОМ --- */}
                        {isMentor && (
                            <div style={{marginTop: 40, borderTop: '2px solid #eee', paddingTop: 20}}>

                                {/* 1. Добавляем саму Панель управления (которой не хватало) */}
                                <MentorAdminPanel
                                    project={selectedProject}
                                    onUpdate={async () => {
                                        // Обновляем данные проекта после нажатия кнопок
                                        const res = await axios.get(`${API_URL}/projects/${selectedProject.id}/`);
                                        setSelectedProject(res.data);
                                        fetchProjects(); // Обновляем список на главной
                                    }}
                                />

                                {/* 2. Менеджер кандидатов (он у вас уже был) */}
                                <div style={{ marginTop: 40 }}>
                                    <CandidatesManager
                                        projectId={selectedProject.id}
                                        onShowProfile={(u) => setViewedUser(u)}
                                        maxStudents={selectedProject.max_students}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Вставка HTML из редактора */}
                        <div className="rich-text-content ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: selectedProject.full_description || selectedProject.description }} />

                        {/* БЛОК ВОПРОСОВ И ОТВЕТОВ */}
                        <ProjectComments
                            project={selectedProject}
                            onUpdate={async () => {
                                const res = await axios.get(`${API_URL}/projects/${selectedProject.id}/`);
                                setSelectedProject(res.data);
                            }}
                        />
                    </div>
                </div>

                <ApplicationModal
                    isOpen={isApplyModalOpen}
                    onClose={() => setIsApplyModalOpen(false)}
                    onSubmit={handleApply}
                />
            </div>
        );
    };

    // 1. ДЕТАЛЬНАЯ СТРАНИЦА
    if (selectedProject) {
        return renderProjectDetail();
    }

    // 2. ЛОГИН / РЕГИСТРАЦИЯ (UI)
    if (!token) return (
        <div className="login-wrapper">
            <div className="login-card fade-up">
                <div className="login-logos">
                    <img src="/sber_logo.png" height="50" alt="Sber" />
                </div>

                <h2>{isRegistering ? 'Регистрация' : 'Вход в SberLab'}</h2>

                {/* --- ФОРМА ВХОДА --- */}
                {!isRegistering ? (
                    <form onSubmit={handleLogin} className="login-form">
                        <input
                            placeholder="Логин"
                            value={loginData.username}
                            onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                            className="form-input"
                        />
                        <input
                            type="password"
                            placeholder="Пароль"
                            value={loginData.password}
                            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                            className="form-input"
                        />
                        <button className="btn-primary btn-full">Войти</button>

                        <div className="login-form-switch">
                            Нет аккаунта? <span onClick={() => setIsRegistering(true)}>Зарегистрироваться</span>
                        </div>
                    </form>
                ) : (
                    /* --- ФОРМА РЕГИСТРАЦИИ --- */
                    <form onSubmit={handleRegister} className="login-form">
                        <input
                            placeholder="Придумайте Логин *"
                            required
                            value={regData.username}
                            onChange={e => setRegData({ ...regData, username: e.target.value })}
                            className="form-input"
                        />
                        <input
                            placeholder="ФИО (Полностью) *"
                            required
                            value={regData.fio}
                            onChange={e => setRegData({ ...regData, fio: e.target.value })}
                            className="form-input"
                        />
                        <input
                            type="password"
                            placeholder="Пароль *"
                            required
                            value={regData.password}
                            onChange={e => setRegData({ ...regData, password: e.target.value })}
                            className="form-input"
                        />

                        {/* Выбор роли */}
                        <select
                            className="form-input"
                            value={regData.role}
                            onChange={e => setRegData({ ...regData, role: e.target.value })}
                        >
                            <option value="student">🎓 Я Студент</option>
                            <option value="mentor">💼 Я Ментор (Сбер)</option>
                            <option value="teacher">🏫 Я Преподаватель</option>
                            <option value="hr">💼 Я HR</option>
                        </select>

                        {/* Поля только для студента */}
                        {regData.role === 'student' && (
                            <div className="fade-in row-fields">
                                <input
                                    placeholder="Группа (21203)"
                                    value={regData.group_number}
                                    onChange={e => setRegData({ ...regData, group_number: e.target.value })}
                                    className="form-input"
                                />
                                <input
                                    placeholder="Ср. балл (4.5)"
                                    type="number"
                                    step="0.1"
                                    value={regData.gpa}
                                    onChange={e => setRegData({ ...regData, gpa: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                        )}

                        <button className="btn-primary btn-full">Создать аккаунт</button>

                        <div className="login-form-switch">
                            Уже есть аккаунт? <span onClick={() => setIsRegistering(false)}>Войти</span>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    // 3. MAIN APP
    return (
        <>
            <header className="glass-header">
                <div className="container header-inner">
                    <div className="logos">
                        <img src="/sber_logo.png" height="42" alt="Sber" />
                    </div>
                    <nav className="nav-pills">
                        <button className={view==='all'?'active':''} onClick={()=>setView('all')}>🛠️ Витрина</button>
                        <button className={view==='my'?'active':''} onClick={()=>setView('my')}> ❤️ Мои проекты</button>

                        {/* Вкладка Архива только для Ментора */}
                        {user.role === 'mentor' && (
                            <button className={view==='archive'?'active':''} onClick={()=>setView('archive')}>📁 Архив</button>
                        )}

                        {/* HR Dashboard для менторов, преподавателей и HR */}
                        {(user.role === 'teacher' || user.role === 'hr') && (
                            <button className={view==='hr'?'active':''} onClick={()=>setView('hr')}>💼 HR</button>
                        )}
                        {(user.role === 'teacher' || user.role === 'hr' || user.role === 'mentor') && (
                            <button className={view === 'analytics' ? 'active' : ''} onClick={() => setView('analytics')}>📊 Аналитика</button>
                            )}
                        <button className={view==='profile'?'active':''} onClick={()=>setView('profile')}>👤 Профиль</button>
                        {user.role === 'teacher' && <button className={view==='teacher'?'active':''} onClick={()=>setView('teacher')}>🏫 Деканат</button>}
                        <button onClick={()=>{localStorage.clear(); window.location.reload();}} className="btn-logout">➜] Выход</button>

                    </nav>
                </div>
            </header>

            <div className="container main-content fade-in">

                {/* --- РЕНДЕР МОДАЛКИ --- */}
                <ProjectEditorModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={handleCreateProject}
                    isAiLoading={isAiLoading}
                    handleAiGenerate={handleAiGenerateLogic}
                />

                {/* --- ПАНЕЛЬ ПРЕПОДАВАТЕЛЯ --- */}
                {view === 'teacher' && (
                    <TeacherDashboard students={allUsers} onVerify={handleVerifyStudent} />
                )}

                {/* --- АНАЛИТИКА --- */}
                {view === 'analytics' && (
                    <AnalyticsDashboard projects={projects} users={allUsers} />
                )}

                {/* --- HR DASHBOARD --- */}
                {view === 'hr' && (
                    <HRDashboard onShowProfile={(u) => setViewedUser(u)} />
                )}

                {/* --- ПРОФИЛЬ --- */}
                {view === 'profile' && profileData && (
                    <div className="profile-container fade-in">
                        {!isEditingProfile ? (
                            <div className="profile-wrapper">
                                {/* Верхняя карточка */}
                                <div className="card profile-card">
                                    <div className="profile-header-bg"></div>
                                    <div className="profile-content">
                                        <div className="profile-top-row">
                                            <div className="profile-avatar-wrapper">
                                                <Avatar name={profileData.fio} url={profileData.avatar} size={120} />
                                            </div>
                                            <div style={{display:'flex', gap:10}}>
                                                {profileData.resume && (
                                                    <a href={profileData.resume.startsWith('http') ? profileData.resume : `${MEDIA_URL}${profileData.resume}`}
                                                       target="_blank"
                                                       className="btn-secondary"
                                                       style={{textDecoration:'none', display:'flex', alignItems:'center', gap:5}}
                                                       download
                                                    >
                                                        📄 Скачать резюме
                                                    </a>
                                                )}
                                                <button className="btn-primary" onClick={() => setIsEditingProfile(true)}>✎ Редактировать</button>
                                            </div>
                                        </div>

                                        <h1 className="profile-name">{profileData.fio}</h1>
                                        <div className="profile-role">
                                            {profileData.role === 'mentor' ? '🔥 Ментор СберЛаб' :
                                                profileData.role === 'teacher' ? '🏫 Преподаватель' :
                                                    profileData.role === 'hr' ? '💼 HR' : '🎓 Студент НГУ'}
                                        </div>

                                        <div className="profile-links">
                                            {profileData.telegram && (
                                                <a href={`https://t.me/${profileData.telegram.replace('@', '')}`} target="_blank" className="social-link telegram" rel="noreferrer">
                                                    ✈️ {profileData.telegram}
                                                </a>
                                            )}
                                            {profileData.github && (
                                                <a href={profileData.github} target="_blank" className="social-link github" rel="noreferrer">
                                                    👾 GitHub
                                                </a>
                                            )}
                                        </div>

                                        <div className="profile-section">
                                            <h3>Hard Skills</h3>
                                            <div className="tech-row">
                                                {profileData.tech_stack ? profileData.tech_stack.split(',').map((t, i) => (
                                                    <span key={i} className="tech-tag">{t.trim()}</span>
                                                )) : <span className="text-muted">Навыки не указаны</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Секция "О себе" */}
                                <div className="card" style={{ marginTop: 24, padding: 32 }}>
                                    <h3 style={{marginBottom: 20, borderBottom:'1px solid #eee', paddingBottom:10}}>Опыт и Резюме</h3>
                                    {profileData.about ? (
                                        <div className="rich-text-content ql-editor" style={{padding:0}} dangerouslySetInnerHTML={{ __html: profileData.about }} />
                                    ) : (
                                        <p className="text-muted">Информация не заполнена.</p>
                                    )}
                                </div>

                                {/* Секция "История проектов" */}
                                <div className="card" style={{ marginTop: 24, padding: 32 }}>
                                    <h3 style={{marginBottom: 20}}>Портфолио проектов</h3>
                                    {profileData.portfolio && profileData.portfolio.length > 0 ? (
                                        <div className="portfolio-grid">
                                            {profileData.portfolio.map(p => (
                                                <div key={p.id} className="portfolio-item">
                                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                                                        <span className={`badge status-badge ${p.status}`}>
                                                            {p.status === 'done' ? 'Завершен' : p.status === 'in_progress' ? 'В работе' : 'Активен'}
                                                        </span>
                                                        <span className={`badge complexity-${p.complexity}`} style={{fontSize:10}}>
                                                            {getComplexityLabel(p.complexity)}
                                                        </span>
                                                    </div>
                                                    <h4 style={{margin:'10px 0', fontSize:16}}>{p.title}</h4>
                                                    <div className="tech-row" style={{marginBottom:0}}>
                                                        {p.tech_stack?.split(',').slice(0,2).map((t,i) => <span key={i} className="tech-tag" style={{fontSize:10}}>{t}</span>)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted">Пока нет участия в проектах.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // === РЕЖИМ РЕДАКТИРОВАНИЯ ===
                            <div className="card edit-form-container">
                                <h2 className="edit-form-header">Редактирование портфолио</h2>
                                <form onSubmit={handleUpdateProfile} className="form-grid">
                                    {/* Аватар */}
                                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                        <Avatar name={profileData.fio} url={profileData.avatar} size={80} />
                                        <div>
                                            <label className="form-label">Фото профиля</label>
                                            <input type="file" onChange={e => setAvatarFile(e.target.files[0])} className="form-input" style={{padding:8}} />
                                        </div>
                                    </div>

                                    {/* Основные данные */}
                                    <div>
                                        <label className="form-label">ФИО</label>
                                        <input className="form-input" value={profileData.fio} onChange={e => setProfileData({ ...profileData, fio: e.target.value })} />
                                    </div>

                                    <div className="row-2-col">
                                        <div style={{flex:1}}>
                                            <label className="form-label">Telegram (@username)</label>
                                            <input className="form-input" value={profileData.telegram || ''} onChange={e => setProfileData({ ...profileData, telegram: e.target.value })} />
                                        </div>
                                        <div style={{flex:1}}>
                                            <label className="form-label">GitHub / Portfolio URL</label>
                                            <input className="form-input" value={profileData.github || ''} onChange={e => setProfileData({ ...profileData, github: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Резюме Файл */}
                                    <div>
                                        <label className="form-label">Прикрепить файл резюме (PDF/DOCX)</label>
                                        <div style={{display:'flex', gap:10, alignItems:'center'}}>
                                            <input type="file" onChange={e => {
                                                setProfileData({...profileData, resumeFile: e.target.files[0]})
                                            }} className="form-input" style={{padding:8}} />
                                            {profileData.resume && <span style={{fontSize:12, color:'green'}}>✓ Файл уже загружен</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Стек технологий (через запятую)</label>
                                        <input className="form-input" value={profileData.tech_stack || ''} onChange={e => setProfileData({ ...profileData, tech_stack: e.target.value })} placeholder="Python, Django, React..." />
                                        <small style={{color:'#666'}}>Используется AI для подбора задач</small>
                                    </div>

                                    {/* Rich Editor для "О себе" */}
                                    <div>
                                        <label className="form-label">О себе / Резюме (подробно)</label>
                                        <ReactQuill
                                            theme="snow"
                                            value={profileData.about || ''}
                                            onChange={(val) => setProfileData(prev => ({ ...prev, about: val }))}
                                            style={{height: 200, marginBottom: 50}}
                                            placeholder="Расскажите о своем опыте, курсах и достижениях..."
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                        <button className="btn-primary">Сохранить изменения</button>
                                        <button type="button" className="btn-secondary" onClick={() => setIsEditingProfile(false)}>Отмена</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* --- СПИСОК ПРОЕКТОВ --- */}
                {view !== 'profile' && view !== 'teacher' && view !== 'hr' && (
                    <>
                        <div className="page-header">
                            <h1 className="page-title">
                                {view === 'all' ? 'Витрина проектов' :
                                    view === 'my' ? 'Мои проекты' :
                                        view === 'archive' ? 'Архив проектов' : 'Проекты'}
                            </h1>
                            {user.role === 'mentor' && (
                                <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                                    + Создать задачу
                                </button>
                            )}
                        </div>

                        <div className="grid">
                            {displayedProjects.map(p => {
                                const isFull = p.students_info?.length >= p.max_students;
                                return (
                                    <div key={p.id} className="card project-card">
                                        <div className="card-top">
                                            <div style={{ display: 'flex', gap: 5 }}>
                                                {p.is_diploma_allowed && <span className="badge" style={{background:'#DBEAFE', color:'#1E40AF'}}>Диплом</span>}
                                                {p.is_nda_required && <span className="badge" style={{background:'#FEE2E2', color:'#991B1B'}}>NDA</span>}
                                                <span className={`badge complexity-${p.complexity}`}>{getComplexityLabel(p.complexity)}</span>
                                                {p.match_score > 0 && user.role === 'student' && <span className="ai-match">Match {p.match_score}%</span>}
                                            </div>
                                            <div className="team-count">👥 {p.students_count || 0}/{p.max_students}</div>
                                        </div>
                                        <h2 onClick={() => setSelectedProject(p)} style={{cursor:'pointer'}}>{p.title}</h2>
                                        <div className="tech-row">{p.tech_stack?.split(',').slice(0, 3).map((t, i) => <span key={i} className="tech-tag">{t.trim()}</span>)}</div>
                                        <div className="description">{p.description}</div>
                                        <button onClick={() => setSelectedProject(p)} className="btn-details">Подробнее</button>
                                        <div className="card-footer">
                                            <div className="mentor-info">
                                                <div style={{cursor: 'pointer'}} onClick={() => {
                                                    if (p.mentor_info || p.creator) {
                                                        setViewedUser(p.mentor_info || p.creator);
                                                    }
                                                }}>
                                                    <Avatar name={p.mentor_info?.fio || p.creator?.fio} url={p.mentor_info?.avatar || p.creator?.avatar} size={24} />
                                                </div>
                                                <span className="mentor-name">{(p.mentor_info?.fio || p.creator?.fio)?.split(' ')[0]}</span>
                                            </div>
                                            <div className="action-block">
                                                {p.my_status === 'accepted' && <span className="status-badge" style={{background:'#DCFCE7', color:'green'}}>В команде</span>}
                                                {p.my_status === 'pending' && <span className="status-badge" style={{background:'#FEF3C7', color:'orange'}}>Заявка</span>}
                                                {user.role === 'student' && !p.my_status && !isFull && p.status === 'open' && (
                                                    <button onClick={() => setSelectedProject(p)} className="btn-join-icon" title="Подать заявку">+</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default App;
