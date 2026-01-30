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
const API_URL = 'http://127.0.0.1:8000/api';
const MEDIA_URL = 'http://127.0.0.1:8000';

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
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-window" style={{maxWidth: 600, height:'auto'}} onClick={e=>e.stopPropagation()}>
                <div className="modal-header"><h3>Карточка участника</h3><button className="btn-close" onClick={onClose}>✕</button></div>
                <div className="modal-body">
                    <div style={{display:'flex', gap:20, alignItems:'start'}}>
                        <div style={{textAlign:'center'}}>
                            <Avatar name={user.fio} url={user.avatar} size={120} />
                            <div className="badge" style={{marginTop:10, display:'inline-block'}}>{user.role}</div>
                        </div>
                        <div style={{flex:1}}>
                            <h2 style={{marginTop:0}}>{user.fio}</h2>

                            {user.role === 'student' && (
                                <div style={{display:'flex', gap:10, marginBottom:15}}>
                                    <div style={{background:'#F3F4F6', padding:'5px 10px', borderRadius:6}}>⭐ GPA: <b>{user.gpa}</b></div>
                                    <div style={{background:'#F3F4F6', padding:'5px 10px', borderRadius:6}}>📚 Группа: <b>{user.group_number}</b></div>
                                    {user.is_verified && <span style={{color:'green', display:'flex', alignItems:'center'}}>✅ Verified</span>}
                                </div>
                            )}

                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:15}}>
                                {user.telegram && <a href={`https://t.me/${user.telegram.replace('@','')}`} target="_blank" className="btn-secondary">✈️ Telegram</a>}
                                {user.github && <a href={user.github} target="_blank" className="btn-secondary">👾 GitHub</a>}
                                {user.resume && <a href={user.resume} target="_blank" className="btn-secondary">📄 Резюме</a>}
                            </div>

                            <div style={{marginBottom:10}}>
                                <label className="mentor-label">Стек технологий</label>
                                <div>{user.tech_stack || '-'}</div>
                            </div>

                            {user.about && (
                                <div>
                                    <label className="mentor-label">О себе</label>
                                    <p style={{fontSize:14, lineHeight:1.5}} dangerouslySetInnerHTML={{__html: user.about}}></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- КОМПОНЕНТ: ПАНЕЛЬ УПРАВЛЕНИЯ МЕНТОРА ---
const MentorAdminPanel = ({ project, onUpdate }) => {
    const [resTitle, setResTitle] = useState('');
    const [resUrl, setResUrl] = useState('');

    const addResource = async () => { /* ...старый код... */ };

    // Логика статусов
    const changeStatus = async (newStatus) => {
        // Мы используем patch для смены статуса, либо кастомный action
        // Для простоты используем patch (стандартный update)
        try {
            const formData = new FormData();
            formData.append('status', newStatus);
            await axios.patch(`${API_URL}/projects/${project.id}/`, formData);
            onUpdate();
        } catch(e) { alert('Ошибка'); }
    };

    return (
        <div style={{ background: '#F3F4F6', padding: 20, borderRadius: 12, marginTop: 30, border: '1px solid #E5E7EB' }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h3>🛠 Панель управления</h3>
                <div style={{display:'flex', gap:10}}>
                    {project.status === 'open' && (
                        <button className="btn-primary" onClick={() => changeStatus('in_progress')}>▶️ Запустить в работу</button>
                    )}
                    {project.status === 'in_progress' && (
                        <button className="btn-primary" style={{background:'#059669'}} onClick={() => changeStatus('done')}>🏁 Завершить проект</button>
                    )}

                    {/* Кнопка Архивации / Восстановления */}
                    {project.status !== 'done' ? (
                        <button className="btn-secondary" style={{color:'red'}} onClick={() => changeStatus('done')}>📁 В архив</button>
                    ) : (
                        <button className="btn-secondary" onClick={() => changeStatus('open')}>♻️ Восстановить</button>
                    )}
                </div>
            </div>

            {/* Блок ресурсов показываем ТОЛЬКО если нужен NDA или проект уже в работе */}
            {(project.is_nda_required || project.status === 'in_progress') && (
                <div style={{ marginBottom: 20, background:'white', padding:15, borderRadius:8 }}>
                    <h4 style={{marginTop:0}}>🔐 Управление доступами {project.is_nda_required && '(NDA)'}</h4>
                    <p className="text-muted" style={{fontSize:13, marginBottom:10}}>
                        Ссылки, добавленные здесь, увидят только принятые студенты {project.is_nda_required && 'подписавшие NDA'}.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input className="form-input" placeholder="Название (GitLab, Figma)" value={resTitle} onChange={e => setResTitle(e.target.value)} />
                        <input className="form-input" placeholder="URL" value={resUrl} onChange={e => setResUrl(e.target.value)} />
                        <button className="btn-secondary" onClick={addResource}>Добавить</button>
                    </div>
                </div>
            )}

            {/* Поле для Диплома */}
            {project.is_diploma_allowed && (
                <div style={{ marginBottom: 20, background:'white', padding:15, borderRadius:8 }}>
                    <h4 style={{marginTop:0}}>🎓 Научное обоснование</h4>
                    <p className="text-muted" style={{fontSize:13}}>Это увидят преподаватели ВУЗа.</p>
                    <div style={{padding:10, background:'#f9f9f9', borderRadius:4, fontStyle:'italic'}}>
                        {project.scientific_value || 'Не заполнено. Отредактируйте проект, чтобы добавить.'}
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

// --- КОМПОНЕНТ УПРАВЛЕНИЯ КАНДИДАТАМИ (ОБНОВЛЕННЫЙ С "КИК") ---
const CandidatesManager = ({ projectId, onShowProfile }) => {
    const [candidates, setCandidates] = useState([]);

    const fetchCandidates = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects/${projectId}/candidates/`);
            setCandidates(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (projectId) fetchCandidates();
    }, [projectId]);

    const handleDecision = async (partId, action) => {
        try {
            await axios.post(`${API_URL}/projects/${projectId}/manage_candidate/${partId}/`, { action });
            fetchCandidates();
        } catch (e) { alert(e.response?.data?.error || 'Ошибка'); }
    };

    const handleKick = async (userId) => {
        if(!confirm('Удалить студента из команды?')) return;
        try {
            await axios.post(`${API_URL}/projects/${projectId}/kick_student/`, { student_id: userId });
            fetchCandidates();
        } catch (e) { alert('Ошибка'); }
    };

    // Разделяем на заявки и команду
    const pending = candidates.filter(c => c.status === 'pending');
    const team = candidates.filter(c => c.status === 'accepted');

    return (
        <div style={{marginTop: 20}}>
            {/* БЛОК КОМАНДЫ */}
            <h4>Команда ({team.length})</h4>
            <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', marginBottom:20}}>
                {team.map(c => (
                    <div key={c.id} className="card" style={{padding:15, display:'flex', alignItems:'center', gap:10}}>
                        <div onClick={()=>onShowProfile(c.user)} style={{cursor:'pointer'}}>
                            <Avatar name={c.user.fio} url={c.user.avatar} size={40} />
                        </div>
                        <div style={{flex:1}}>
                            <div style={{fontWeight:'bold', cursor:'pointer'}} onClick={()=>onShowProfile(c.user)}>{c.user.fio}</div>
                            <div style={{fontSize:12, color:'gray'}}>GPA: {c.user.gpa || 'Нет данных'}</div>
                        </div>
                        <button className="btn-danger-outline" style={{padding:'5px 10px'}} onClick={()=>handleKick(c.user.id)}>✕</button>
                    </div>
                ))}
                {team.length === 0 && <p className="text-muted">Команда пуста.</p>}
            </div>

            {/* БЛОК ЗАЯВОК */}
            <h4>Новые заявки ({pending.length})</h4>
            {pending.map(c => (
                <div key={c.id} className="card" style={{marginBottom: 10, borderLeft: '4px solid orange'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                        <div style={{display:'flex', gap: 10}}>
                            <div onClick={()=>onShowProfile(c.user)} style={{cursor:'pointer'}}>
                                <Avatar name={c.user.fio} url={c.user.avatar} />
                            </div>
                            <div>
                                <b onClick={()=>onShowProfile(c.user)} style={{cursor:'pointer'}}>{c.user.fio}</b>
                                {c.is_diploma_request && <span className="badge" style={{background:'#DBEAFE', color:'#1E40AF', marginLeft:8}}>Хочет диплом</span>}
                                <div style={{background:'#F9FAFB', padding:8, borderRadius:6, marginTop:5, fontSize:13}}>"{c.cover_letter}"</div>
                            </div>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', gap:5}}>
                            <button className="btn-primary" style={{fontSize:12}} onClick={() => handleDecision(c.id, 'accept')}>Принять</button>
                            <button className="btn-secondary" style={{fontSize:12, color:'red'}} onClick={() => handleDecision(c.id, 'reject')}>Отказать</button>
                        </div>
                    </div>
                </div>
            ))}
            {pending.length === 0 && <p className="text-muted">Новых заявок нет.</p>}
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
    const [view, setView] = useState('all'); // 'all', 'my', 'profile', 'teacher'
    const [projects, setProjects] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [viewedUser, setViewedUser] = useState(null); // Кого смотрим в профиле

    // Модалки и формы
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

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
                data = data.filter(p =>
                    p.mentor_info?.id == user.id ||
                    p.students_info?.some(s => s.id == user.id)
                ).reverse();
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
        if (token) {
            if (view === 'profile') {
                fetchProfile();
            } else if (view === 'teacher') {
                fetchUsers();
            } else {
                fetchProjects();
                setSelectedProject(null);
            }

            if (user.role === 'teacher') {
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
        if (view === 'archive') {
            // Показываем только завершенные/архивные И только мои (если я ментор)
            return projects.filter(p => p.status === 'done' && p.creator.id == user.id);
        }
        if (view === 'my') {
            // Мои активные
            return projects.filter(p => (p.mentor_info?.id == user.id || p.my_status) && p.status !== 'done');
        }
        // Витрина: только активные
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
                {/* МОДАЛКА ПРОФИЛЯ (ВСЕГДА В DOM, НО СКРЫТА) */}
                <UserProfileModal user={viewedUser} onClose={()=>setViewedUser(null)} />

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

                        {/* --- АДМИН ПАНЕЛЬ МЕНТОРА (НОВОЕ) --- */}
                        {isMentor && (
                            <MentorAdminPanel
                                project={selectedProject}
                                onUpdate={async () => {
                                    // Обновляем данные проекта после изменений
                                    const res = await axios.get(`${API_URL}/projects/${selectedProject.id}/`);
                                    setSelectedProject(res.data);
                                }}
                            />
                        )}

                        {/* --- УПРАВЛЕНИЕ КОМАНДОЙ (ОБНОВЛЕННОЕ) --- */}
                        {isMentor && (
                            <div style={{marginTop: 40, borderTop: '2px solid #eee', paddingTop: 20}}>
                                <h2>👨‍🏫 Управление командой</h2>
                                <CandidatesManager
                                    projectId={selectedProject.id}
                                    onShowProfile={(u) => setViewedUser(u)} // Открываем модалку
                                />
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
                    <img src="/nsu_logo.svg" height="50" alt="NSU" />
                    <span className="login-x">✕</span>
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
                        <img src="/nsu_logo.svg" height="42" alt="NSU" />
                        <span className="divider">✕</span>
                        <img src="/sber_logo.png" height="42" alt="Sber" />
                    </div>
                    <nav className="nav-pills">
                        <button className={view==='all'?'active':''} onClick={()=>setView('all')}>Витрина</button>
                        <button className={view==='my'?'active':''} onClick={()=>setView('my')}>Мои проекты</button>

                        {/* Вкладка Архива только для Ментора */}
                        {user.role === 'mentor' && (
                            <button className={view==='archive'?'active':''} onClick={()=>setView('archive')}>📁 Архив</button>
                        )}

                        <button className={view==='profile'?'active':''} onClick={()=>setView('profile')}>👤 Профиль</button>
                        {user.role === 'teacher' && <button onClick={()=>setView('teacher')}>🏫 Деканат</button>}
                        <button onClick={()=>{localStorage.clear(); window.location.reload();}} className="btn-logout">Выход</button>
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
                                            {profileData.role === 'mentor' ? '🔥 Ментор СберЛаб' : '🎓 Студент НГУ'}
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
                {view !== 'profile' && view !== 'teacher' && (
                    <>
                        <div className="page-header">
                            <h1 className="page-title">{view === 'all' ? 'Витрина проектов' : 'Мои проекты'}</h1>
                            {user.role === 'mentor' && (
                                <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                                    + Создать задачу
                                </button>
                            )}
                        </div>

                        <div className="grid">
                            {projects.map(p => {
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
                                            <div className="team-count">👥 {p.students_info?.length || 0}/{p.max_students}</div>
                                        </div>
                                        <h2 onClick={() => setSelectedProject(p)}>{p.title}</h2>
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