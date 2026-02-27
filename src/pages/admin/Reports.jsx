import { useAuth } from '../../context/AuthContext'
import { BarChart3, TrendingUp, Calculator, Target } from 'lucide-react'

export default function Reports() {
    const { data, formatCLP } = useAuth()
    const publishedBooks = data.books.filter(b => b.status === 'Publicado')

    const getBookFinancials = (bookId) => {
        const expenses = data.finances.invoices.filter(i => i.bookId === bookId && i.type === 'egreso').reduce((s, i) => s + i.amount, 0)
        const income = data.finances.invoices.filter(i => i.bookId === bookId && i.type === 'ingreso').reduce((s, i) => s + i.amount, 0)
        return { expenses, income, profit: income - expenses, roi: expenses > 0 ? ((income - expenses) / expenses * 100) : 0 }
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" />Reportes de Rentabilidad
                </h1>
                <p className="text-dark-600 text-sm mt-1">Escandallo vs. Resultados Reales</p>
            </div>

            {publishedBooks.map(book => {
                const fin = getBookFinancials(book.id)
                return (
                    <div key={book.id} className="glass-card p-5">
                        <h3 className="text-lg font-medium text-white mb-4">{book.title}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-dark-50 rounded-lg p-3 text-center">
                                <Calculator className="w-5 h-5 text-primary mx-auto mb-1" />
                                <p className="text-lg font-bold text-white">{formatCLP(fin.expenses)}</p>
                                <p className="text-[10px] text-dark-600 uppercase">Costos Reales</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-3 text-center">
                                <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                                <p className="text-lg font-bold text-emerald-400">{formatCLP(fin.income)}</p>
                                <p className="text-[10px] text-dark-600 uppercase">Ingresos</p>
                            </div>
                            <div className={`rounded-lg p-3 text-center ${fin.profit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                <Target className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                                <p className={`text-lg font-bold ${fin.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCLP(fin.profit)}</p>
                                <p className="text-[10px] text-dark-600 uppercase">Beneficio</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-3 text-center">
                                <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                                <p className={`text-lg font-bold ${fin.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fin.roi.toFixed(1)}%</p>
                                <p className="text-[10px] text-dark-600 uppercase">ROI</p>
                            </div>
                        </div>
                        {/* Visual bar */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-dark-600 w-16">Egresos</span>
                                <div className="flex-1 h-4 bg-dark-300 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: `${fin.income > 0 ? (fin.expenses / Math.max(fin.income, fin.expenses)) * 100 : 100}%` }} />
                                </div>
                                <span className="text-xs text-dark-800 w-24 text-right">{formatCLP(fin.expenses)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-dark-600 w-16">Ingresos</span>
                                <div className="flex-1 h-4 bg-dark-300 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${fin.expenses > 0 ? (fin.income / Math.max(fin.income, fin.expenses)) * 100 : 100}%` }} />
                                </div>
                                <span className="text-xs text-dark-800 w-24 text-right">{formatCLP(fin.income)}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
