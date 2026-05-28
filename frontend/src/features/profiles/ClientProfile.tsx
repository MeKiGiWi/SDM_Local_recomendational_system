import { syntheticFromProfile } from '../../model/syntheticFromProfile.generated'
import { colors, formatRubles } from '../../shared/config/theme'
import { formatIncomeQuantile, type ProfileData } from './ClientSelector'

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function ClientProfile({ profile }: { profile: ProfileData }) {
  const synthetic = syntheticFromProfile(profile.age, profile.monthlyIncome, profile.balance, profile.segment)
  const ownedProducts = profile.ownedProducts.length > 0 ? profile.ownedProducts.join(', ') : 'нет'
  const balanceLabel = profile.balanceSource.includes('proxy') ? 'Оценка остатка' : 'Остаток'

  return (
    <article className="profile-detail surface-panel rounded-[1.25rem] h-full flex flex-col overflow-hidden">
      <div className="px-5 pt-6 pb-4 text-center" style={{ background: profile.avatarBg }}>
        <div className="profile-detail__avatar mx-auto">
          <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mt-3" style={{ color: colors.text.primary }}>
          Реальный клиент из датасета
        </h2>
        <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
          Доход {formatRubles(profile.monthlyIncomeRub)} • квантиль {formatIncomeQuantile(profile.incomeQuantile)}
        </p>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Возраст" value={`${profile.age} лет`} />
          <InfoCard label="Доход" value={formatRubles(profile.monthlyIncomeRub)} />
          <InfoCard label="Квантиль дохода" value={formatIncomeQuantile(profile.incomeQuantile)} />
          <InfoCard label={balanceLabel} value={formatRubles(profile.balance)} />
          <InfoCard label="Стаж" value={`${profile.seniorityMonths} мес.`} />
          <InfoCard label="Сегмент" value={profile.segment} />
          <InfoCard label="Регион" value={profile.regionName} />
          <InfoCard label="Новый клиент" value={profile.isNewCustomer === 1 ? 'Да' : 'Нет'} />
          <InfoCard label="Пол" value={profile.sexLabel} />
        </div>

        <div>
          <p className="section-label mb-2">Активные продукты</p>
          <p className="text-sm leading-relaxed" style={{ color: colors.text.secondary }}>
            {ownedProducts}
          </p>
        </div>

        <div>
          <p className="section-label mb-2">Synthetic индикаторы</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoCard label="Активность" value={formatPercent(synthetic.synthetic_activity_score / 2.5)} />
            <InfoCard label="Кредитная нагрузка" value={formatPercent(synthetic.synthetic_credit_pressure / 1.5)} />
            <InfoCard label="Сбер. потенциал" value={formatPercent((synthetic.synthetic_savings_capacity + 1) / 3)} />
            <InfoCard label="Бизнес-интенсивность" value={formatPercent(synthetic.synthetic_business_intensity)} />
            <InfoCard label="Фин. интенсивность" value={formatPercent(synthetic.synthetic_financial_intensity / 3)} />
          </div>
        </div>
      </div>
    </article>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border px-3 py-3" style={{ borderColor: colors.borderLight, background: colors.surface }}>
      <div className="text-[11px] uppercase tracking-wider" style={{ color: colors.text.muted }}>
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold" style={{ color: colors.text.primary }}>
        {value}
      </div>
    </div>
  )
}
