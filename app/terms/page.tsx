const SECTIONS = [
  {
    title: '1. Предмет соглашения',
    body: 'Настоящие Условия использования регулируют отношения между ARCANE.UZ и пользователями сервиса в части приобретения цифровых товаров (ключей активации игр и программного обеспечения).',
  },
  {
    title: '2. Цифровые товары',
    body: 'Все товары являются цифровыми (ключи активации). После успешной оплаты ключ доставляется на указанный email. Ключ активации является однократным — после активации возврат невозможен, если ключ был использован.',
  },
  {
    title: '3. Гарантии',
    body: 'Мы гарантируем подлинность всех ключей активации. В случае если ключ не работает по нашей вине, мы заменим его или вернём полную стоимость в течение 5 рабочих дней.',
  },
  {
    title: '4. Возврат и обмен',
    body: 'Возврат принимается если: ключ не работает и не был активирован, продукт не соответствует описанию, технические проблемы на нашей стороне. Заявку на возврат нужно подать в течение 48 часов после покупки через Telegram @arcaneuz_support.',
  },
  {
    title: '5. Arcane Coins',
    body: 'Arcane Coins являются внутренней валютой программы лояльности. Они не имеют денежного эквивалента и не подлежат обмену на реальные деньги. ARCANE.UZ оставляет за собой право изменять условия программы.',
  },
  {
    title: '6. Ограничение ответственности',
    body: 'ARCANE.UZ не несёт ответственности за технические сбои платформ (Steam, Epic Games и др.), за изменения в политике региональных ограничений платформодержателей, а также за действия пользователя после получения ключа.',
  },
  {
    title: '7. Изменения условий',
    body: 'Мы можем обновлять эти условия. О существенных изменениях уведомляем через сайт и Telegram-канал. Продолжение использования сервиса после публикации изменений означает согласие с новыми условиями.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-10">
          <p className="font-heading font-semibold text-[#7C3AED] mb-2"
             style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            Юридическая информация
          </p>
          <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Условия использования
          </h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
            Последнее обновление: 1 мая 2025 г.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-heading font-semibold text-white mb-2.5" style={{ fontSize: '16px' }}>{s.title}</h2>
              <p className="font-body text-[#6B7280]" style={{ fontSize: '14px', lineHeight: '1.75' }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl p-5"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="font-body text-[#6B7280]" style={{ fontSize: '13px', lineHeight: '1.65' }}>
            Вопросы по условиям:{' '}
            <a href="https://t.me/arcaneuz_support" target="_blank" rel="noopener noreferrer"
               className="text-[#06B6D4] hover:text-[#22D3EE] transition-colors">
              @arcaneuz_support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
