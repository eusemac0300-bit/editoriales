import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { User, Upload, Save, Instagram, Twitter, Linkedin, FileText, CheckCircle, Clock, Edit3 } from 'lucide-react'

export default function Profile() {
    const { user, data, setData } = useAuth()
    const userData = data.users.find(u => u.id === user.id)

    const [name, setName] = useState(userData?.name || '')
    const [bio, setBio] = useState(userData?.bio || '')
    const [instagram, setInstagram] = useState(userData?.socialLinks?.instagram || '')
    const [twitter, setTwitter] = useState(userData?.socialLinks?.twitter || '')
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setData(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === user.id ? {
                ...u, name, bio, socialLinks: { instagram, twitter }
            } : u)
        }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const manuscripts = [
        { name: 'Los_Ecos_del_Sur_v3.docx', date: '2025-08-10', status: 'En Revisión', size: '2.4 MB' },
        { name: 'Mareas_Internas_borrador.pdf', date: '2026-02-01', status: 'Borrador', size: '1.8 MB' },
        { name: 'El_Algoritmo_Perdido_final.docx', date: '2025-05-15', status: 'Aceptado', size: '3.1 MB' },
    ]

    const statusColors = { 'En Revisión': 'badge-yellow', 'Borrador': 'badge-purple', 'Aceptado': 'badge-green' }

    return (
        <div className="space-y-6 fade-in max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <User className="w-6 h-6 text-purple-400" />Mi Perfil
                </h1>
                <p className="text-dark-600 text-sm mt-1">Edita tu información y sube manuscritos</p>
            </div>

            {/* Avatar */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl font-bold text-white relative">
                        {user.avatar}
                        <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <Edit3 className="w-3 h-3 text-white" />
                        </button>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">{name}</h2>
                        <p className="text-sm text-dark-600">Autora · Editorial Pro</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Nombre Completo</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="input-field" />
                    </div>

                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Biografía</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="input-field" rows={4} placeholder="Escribe tu biografía..." />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</label>
                            <input value={instagram} onChange={e => setInstagram(e.target.value)} className="input-field text-sm" placeholder="@usuario" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 flex items-center gap-1"><Twitter className="w-3 h-3" /> Twitter / X</label>
                            <input value={twitter} onChange={e => setTwitter(e.target.value)} className="input-field text-sm" placeholder="@usuario" />
                        </div>
                    </div>

                    <button onClick={handleSave} className={`btn-primary w-full flex items-center justify-center gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
                        {saved ? <><CheckCircle className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                    </button>
                </div>
            </div>

            {/* Manuscripts */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white">Mis Manuscritos</h2>
                    <button className="btn-primary text-xs px-3 py-1.5">
                        <Upload className="w-3 h-3 inline mr-1" /> Subir Manuscrito
                    </button>
                </div>

                <div className="space-y-2">
                    {manuscripts.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-50/50 hover:bg-dark-200/30 transition-colors">
                            <div className="w-9 h-9 rounded-lg bg-dark-200 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{m.name}</p>
                                <p className="text-[10px] text-dark-600">{m.size} · {m.date}</p>
                            </div>
                            <span className={statusColors[m.status]}>{m.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
