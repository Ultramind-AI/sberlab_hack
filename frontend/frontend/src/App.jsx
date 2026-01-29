import { useEffect, useState } from 'react';
import axios from 'axios';

// --- Swiper ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- НАСТРОЙКИ ---
const API_URL = 'http://127.0.0.1:8000/api';
const MEDIA_URL = 'http://127.0.0.1:8000';

// --- КОМПОНЕНТЫ ---
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

function App() {
    // Auth State
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState({
        id: localStorage.getItem('userId'),
        role: localStorage.getItem('userRole'),
        fio: '...'
    });

    // View & Project State
    const [view, setView] = useState('all'); // 'all', 'my', 'profile'
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);

    // Forms
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    // Updated Create Form State
    const [newProject, setNewProject] = useState({
        title: '', description: '', tech_stack: '', max_students: 3,
        complexity: 'medium', urgency: 'medium', deadline: ''
    });
    const [showCreate, setShowCreate] = useState(false);

    // Axios Setup
    if (token) axios.defaults.headers.common['Authorization'] = `Token ${token}`;

    // --- API CALLS ---
    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/projects/`);
            let data = res.data;

            if (view === 'my') {
                data = data.filter(p =>
                    p.mentor_info.id == user.id ||
                    p.students_info.some(s => s.id == user.id)
                ).reverse();
            } else {
                // УМНАЯ СОРТИРОВКА: Сначала высокий AI Match, потом новые
                data.sort((a, b) => {
                    // Если match_score отличается, сортируем по нему (по убыванию)
                    if (b.match_score !== a.match_score) return b.match_score - a.match_score;
                    // Иначе по дате создания (новые выше)
                    return new Date(b.created_at) - new Date(a.created_at);
                });
            }
            setProjects(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/users/${user.id}/`);
            setProfileData(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (token) {
            if (view === 'profile') {
                fetchProfile();
            } else {
                fetchProjects();
                setSelectedProject(null);
            }
        }
    }, [token, view]);

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

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            // Если дедлайн пустой - отправляем null, чтобы бэк не ругался
            const payload = { ...newProject, deadline: newProject.deadline || null };
            await axios.post(`${API_URL}/projects/`, payload);
            setShowCreate(false);
            fetchProjects();
        } catch (err) { alert('Ошибка создания'); }
    };

    const handleJoin = async (id) => {
        try { await axios.post(`${API_URL}/projects/${id}/join/`); fetchProjects(); }
        catch (err) { alert(err.response?.data?.error || 'Ошибка'); }
    };

    const handleLeave = async (id) => {
        if (!confirm('Покинуть проект?')) return;
        try { await axios.post(`${API_URL}/projects/${id}/leave/`); fetchProjects(); }
        catch (err) { alert('Ошибка'); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('fio', profileData.fio);
        formData.append('about', profileData.about);
        formData.append('tech_stack', profileData.tech_stack);
        formData.append('telegram', profileData.telegram);
        formData.append('github', profileData.github);

        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        try {
            const res = await axios.patch(`${API_URL}/users/${user.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfileData(res.data);
            setIsEditingProfile(false);
            alert('Профиль обновлен!');
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Ошибка сохранения');
        }
    };

    // --- Helper Functions ---
    const getComplexityLabel = (c) => ({ easy: '🟢 Легкий', medium: '🟡 Средний', hard: '🔴 Сложный' }[c] || c);
    const getUrgencyLabel = (u) => ({ low: 'Спокойно', medium: 'Срочно', high: '🔥 Горит' }[u] || u);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '∞ Бессрочно';

    // --- ДЕТАЛЬНАЯ СТРАНИЦА ПРОЕКТА ---
    if (selectedProject) {
        return (
            <div className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
                <button
                    onClick={() => setSelectedProject(null)}
                    className="btn-back"
                >
                    ← Назад к списку
                </button>

                <div className="project-detail-card">
                    {/* --- ГАЛЕРЕЯ (Свайпер) --- */}
                    <div className="swiper-container-wrapper">
                        {selectedProject.images && selectedProject.images.length > 0 ? (
                            <Swiper
                                modules={[Navigation, Pagination]}
                                navigation
                                pagination={{ clickable: true }}
                                className="project-swiper"
                            >
                                {selectedProject.images.map(img => (
                                    <SwiperSlide key={img.id || img.image} className="swiper-slide-custom">
                                        <div className="slide-image-container">
                                            <img
                                                src={img.image.startsWith('http') ? img.image : `${MEDIA_URL}${img.image}`}
                                                alt="Project Slide"
                                            />
                                            <div className="slide-blur-bg" style={{backgroundImage: `url(${img.image})`}}></div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        ) : (
                            <div className="no-image-placeholder">
                                <span>📸 Нет изображений</span>
                            </div>
                        )}
                    </div>

                    {/* --- КОНТЕНТ --- */}
                    <div className="detail-content">
                        {/* Meta Tags (New) */}
                        <div style={{display:'flex', gap: 10, marginBottom: 15, flexWrap:'wrap'}}>
                            <span className={`badge complexity-${selectedProject.complexity}`}>
                                {getComplexityLabel(selectedProject.complexity)}
                            </span>
                            <span className={`badge urgency-${selectedProject.urgency}`}>
                                {getUrgencyLabel(selectedProject.urgency)}
                            </span>
                            <span className="badge" style={{background:'#eee', color:'#555'}}>
                                📅 {formatDate(selectedProject.deadline)}
                            </span>
                            {selectedProject.match_score > 0 && user.role === 'student' && (
                                <span className="ai-match">🤖 Подходит по стеку: {selectedProject.match_score}%</span>
                            )}
                        </div>

                        <h1 className="detail-title">{selectedProject.title}</h1>

                        <div className="tech-row">
                            {selectedProject.tech_stack.split(',').map((t, i) => (
                                <span key={i} className="tech-tag">{t.trim()}</span>
                            ))}
                        </div>

                        <div
                            className="rich-text-content"
                            dangerouslySetInnerHTML={{ __html: selectedProject.full_description || selectedProject.description }}
                        />

                        <div className="team-section">
                            <h3 className="section-title">Команда ({selectedProject.students_info.length}/{selectedProject.max_students})</h3>
                            <div className="avatars-row">
                                {selectedProject.students_info.map(s => (
                                    <div key={s.id} className="avatar-with-name">
                                        <Avatar name={s.fio} url={s.avatar} size={48} />
                                        <span>{s.fio.split(' ')[0]}</span>
                                    </div>
                                ))}
                                {selectedProject.students_info.length === 0 && <span className="text-muted">Пока никого...</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- LOGIN SCREEN ---
    if (!token) return (
        <div className="login-wrapper">
            <div className="login-card fade-up">
                <div className="login-logos">
                    <img src="/nsu_logo.svg" height="50" alt="NSU" />
                    <span className="login-x">✕</span>
                    <img src="/sber_logo.png" height="50" alt="Sber" />
                </div>
                <h2>SberLab Hackathon</h2>
                <p className="login-subtitle">Войдите, чтобы начать творить</p>
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
                </form>
            </div>
        </div>
    );

    // --- MAIN APP ---
    return (
        <>
            <header className="glass-header">
                <div className="container header-inner">
                    <div className="logos">
                        <img src="/nsu_logo.svg" height="42" alt="NSU" />
                        <span className="divider">✕</span>
                        <img src="/sber_logo.png" height="42" alt="Sber" />
                    </div>
                    <nav className="nav-pills">
                        <button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>Витрина</button>
                        <button className={view === 'my' ? 'active' : ''} onClick={() => setView('my')}>Мои проекты</button>
                        <button className={view === 'profile' ? 'active' : ''} onClick={() => setView('profile')}>👤 Профиль</button>
                        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="btn-logout">Выход</button>
                    </nav>
                </div>
            </header>

            <div className="container main-content fade-in">
                {/* --- ПРОФИЛЬ --- */}
                {view === 'profile' && profileData && (
                    <div className="profile-container fade-in">
                        {!isEditingProfile ? (
                            <div className="card profile-card">
                                <div className="profile-header-bg"></div>
                                <div className="profile-content">
                                    <div className="profile-top-row">
                                        <div className="profile-avatar-wrapper">
                                            <Avatar name={profileData.fio} url={profileData.avatar} size={120} />
                                        </div>
                                        <button className="btn-secondary" onClick={() => setIsEditingProfile(true)}>
                                            ✎ Редактировать
                                        </button>
                                    </div>

                                    <h1 className="profile-name">{profileData.fio}</h1>
                                    <div className="profile-role">
                                        {profileData.role === 'mentor' ? '🔥 Ментор СберЛаб' : '🎓 Студент НГУ'}
                                    </div>

                                    <div className="profile-links">
                                        {profileData.telegram && (
                                            <a href={`https://t.me/${profileData.telegram.replace('@', '')}`} target="_blank" className="social-link telegram" rel="noreferrer">
                                                Telegram: {profileData.telegram}
                                            </a>
                                        )}
                                        {profileData.github && (
                                            <a href={profileData.github} target="_blank" className="social-link github" rel="noreferrer">
                                                GitHub / Portfolio
                                            </a>
                                        )}
                                    </div>

                                    <div className="profile-section">
                                        <h3>Стек (для AI подбора)</h3>
                                        <div className="tech-row">
                                            {profileData.tech_stack ? (
                                                profileData.tech_stack.split(',').map((t, i) => (
                                                    <span key={i} className="tech-tag">{t.trim()}</span>
                                                ))
                                            ) : <span style={{color:'#999'}}>Стек не указан</span>}
                                        </div>
                                    </div>

                                    <div className="profile-section">
                                        <h3>О себе</h3>
                                        <p style={{whiteSpace: 'pre-wrap', color: '#4B5563', lineHeight: '1.6'}}>
                                            {profileData.about || 'Расскажите о себе...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* РЕЖИМ РЕДАКТИРОВАНИЯ (Обновленный) */
                            <div className="card edit-form-container">
                                <h2 className="edit-form-header">Редактирование профиля</h2>
                                <form onSubmit={handleUpdateProfile} className="form-grid">
                                    <div style={{display:'flex', gap:20, alignItems:'center'}}>
                                        <Avatar name={profileData.fio} url={profileData.avatar} size={64} />
                                        <input type="file" onChange={e => setAvatarFile(e.target.files[0])} className="form-input" style={{padding:8}} />
                                    </div>

                                    <div>
                                        <label className="form-label">ФИО</label>
                                        <input className="form-input" value={profileData.fio} onChange={e => setProfileData({...profileData, fio: e.target.value})} />
                                    </div>

                                    <div className="row-2-col">
                                        <div style={{flex:1}}>
                                            <label className="form-label">Telegram</label>
                                            <input className="form-input" value={profileData.telegram || ''} onChange={e => setProfileData({...profileData, telegram: e.target.value})} placeholder="@username" />
                                        </div>
                                        <div style={{flex:1}}>
                                            <label className="form-label">GitHub</label>
                                            <input className="form-input" value={profileData.github || ''} onChange={e => setProfileData({...profileData, github: e.target.value})} placeholder="https://..." />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Ваш стек (через запятую)</label>
                                        <input
                                            className="form-input"
                                            value={profileData.tech_stack || ''}
                                            onChange={e => setProfileData({...profileData, tech_stack: e.target.value})}
                                            placeholder="Python, Django, React..."
                                        />
                                        <small style={{color:'#666'}}>Используется AI-алгоритмом для подбора задач</small>
                                    </div>

                                    <div>
                                        <label className="form-label">О себе</label>
                                        <textarea
                                            className="form-input form-textarea"
                                            rows="4"
                                            value={profileData.about || ''}
                                            onChange={e => setProfileData({...profileData, about: e.target.value})}
                                        />
                                    </div>

                                    <div style={{display: 'flex', gap: 10}}>
                                        <button className="btn-primary">Сохранить</button>
                                        <button type="button" className="btn-secondary" onClick={() => setIsEditingProfile(false)}>Отмена</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* --- СПИСОК ПРОЕКТОВ --- */}
                {view !== 'profile' && (
                    <>
                        <div className="page-header">
                            <h1 className="page-title">{view === 'all' ? 'Витрина проектов' : 'Мои проекты'}</h1>
                            {user.role === 'mentor' && (
                                <button className="btn-secondary" onClick={() => setShowCreate(!showCreate)}>
                                    {showCreate ? 'Отмена' : '+ Создать задачу'}
                                </button>
                            )}
                        </div>

                        {showCreate && (
                            <div className="card create-card fade-up">
                                <h3>Новый проект</h3>
                                <form onSubmit={handleCreate} className="form-grid">
                                    <input
                                        className="form-input"
                                        placeholder="Название проекта"
                                        required
                                        value={newProject.title}
                                        onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                    />

                                    {/* НОВЫЕ ПОЛЯ */}
                                    <div className="row-2-col">
                                        <div style={{flex:1}}>
                                            <label className="form-label">Срочность</label>
                                            <select className="form-input" value={newProject.urgency} onChange={e => setNewProject({...newProject, urgency: e.target.value})}>
                                                <option value="low">Спокойно</option>
                                                <option value="medium">Срочно</option>
                                                <option value="high">🔥 Горит</option>
                                            </select>
                                        </div>
                                        <div style={{flex:1}}>
                                            <label className="form-label">Сложность</label>
                                            <select className="form-input" value={newProject.complexity} onChange={e => setNewProject({...newProject, complexity: e.target.value})}>
                                                <option value="easy">Легко</option>
                                                <option value="medium">Средне</option>
                                                <option value="hard">Сложно</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row-2-col">
                                        <div style={{flex:2}}>
                                            <input
                                                className="form-input"
                                                placeholder="Стек (Python, AI...)"
                                                required
                                                value={newProject.tech_stack}
                                                onChange={e => setNewProject({ ...newProject, tech_stack: e.target.value })}
                                            />
                                        </div>
                                        <div style={{flex:1}}>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="Мест"
                                                required
                                                value={newProject.max_students}
                                                onChange={e => setNewProject({ ...newProject, max_students: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Дедлайн (оставьте пустым, если бессрочно)</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={newProject.deadline}
                                            onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                                        />
                                    </div>

                                    <textarea
                                        className="form-input form-textarea"
                                        placeholder="Краткое описание"
                                        required
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    />
                                    <button className="btn-primary">Опубликовать</button>
                                </form>
                            </div>
                        )}

                        <div className="grid">
                            {projects.map(p => {
                                const isFull = p.students_info.length >= p.max_students;
                                return (
                                    <div key={p.id} className="card project-card">
                                        <div className="card-top">
                                            <div style={{display:'flex', gap:5}}>
                                                <span className={`badge complexity-${p.complexity}`}>
                                                    {getComplexityLabel(p.complexity)}
                                                </span>
                                                {/* Показываем Match Score только студентам и если он > 0 */}
                                                {p.match_score > 0 && user.role === 'student' && (
                                                    <span className="ai-match">Подходит на {p.match_score}%</span>
                                                )}
                                            </div>
                                            <div className="team-count">
                                                👥 {p.students_info.length} / {p.max_students}
                                            </div>
                                        </div>

                                        <h2 onClick={() => setSelectedProject(p)}>{p.title}</h2>

                                        <div className="tech-row">
                                            {p.tech_stack.split(',').slice(0, 3).map((t, i) =>
                                                <span key={i} className="tech-tag">{t.trim()}</span>
                                            )}
                                        </div>


                                        <div className="description">{p.description}</div>

                                        <button onClick={() => setSelectedProject(p)} className="btn-details">
                                            Подробнее
                                        </button>

                                        <div className="card-footer">
                                            <div className="mentor-info">
                                                <Avatar name={p.mentor_info.fio} url={p.mentor_info.avatar} size={24} />
                                                <span className="mentor-name">{p.mentor_info.fio.split(' ')[0]}</span>
                                            </div>

                                            <div className="action-block">
                                                {user.role === 'student' && (
                                                    p.is_joined ? (
                                                        <button onClick={() => handleLeave(p.id)} className="btn-danger-outline">
                                                            Выйти
                                                        </button>
                                                    ) : (
                                                        !isFull && p.status === 'open' && (
                                                            <button onClick={() => handleJoin(p.id)} className="btn-join-icon" title="Вступить">
                                                                +
                                                            </button>
                                                        )
                                                    )
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