const SECTIONS = [
  {
    title: '1. Сбор данных',
    body: 'Мы собираем только данные, необходимые для выполнения заказа: email-адрес для отправки ключей активации, Telegram-username (необязательно) для уведомлений и платёжные данные, которые обрабатываются исключительно через сертифицированных платёжных провайдеров (Click, Payme, UzCard, HUMO, Uzum Bank). Мы не храним данные платёжных карт.',
  },
  {
    title: '2. Использование данных',
    body: 'Ваши данные используются исключительно для: доставки цифровых товаров на указанный email, отправки уведомлений о статусе заказа, начисления и списания Arcane Coins, поддержки клиентов через Telegram.',
  },
  {
    title: '3. Хранение данных',
    body: 'Данные о заказах хранятся в течение 3 лет для соответствия требованиям законодательства Республики Узбекистан. Вы можете запросить удаление своих данных, написав в службу поддержки.',
  },
  {
    title: '4. Передача третьим лицам',
    body: 'Мы не продаём и не передаём ваши личные данные третьим лицам, за исключением платёжных провайдеров для обработки транзакций и в случаях, предусмотренных законодательством.',
  },
  {
    title: '5. Cookies',
    body: 'Сайт использует технические cookies для работы авторизации и корзины. Аналитические cookies не применяются без вашего согласия.',
  },
  {
    title: '6. Ваши права',
    body: 'Вы имеете право запросить доступ к своим данным, исправить неточные данные, удалить свои данные, ограничить обработку. Для реализации прав напишите на support@arcane.com.uz или в Telegram @arcaneuz_support.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-10">
          <p className="font-heading font-semibold text-[#7C3AED] mb-2"
             style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            Юридическая информация
          </p>
          <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Политика конфиденциальности
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
            По вопросам конфиденциальности:{' '}
            <a href="mailto:support@arcane.com.uz" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">
              support@arcane.com.uz
            </a>
            {' '}или{' '}
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
