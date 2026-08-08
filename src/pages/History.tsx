import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import Topbar from '../components/Topbar';
import TransactionList from '../components/TransactionList';

export default function History() {
  const { transactions } = useFinance();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title={t('history.title')}
        subtitle={t('history.subtitle')}
      />

      <TransactionList transactions={transactions} />
    </div>
  );
}
