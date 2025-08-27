import React from 'react';
import { getQuota } from '../lib/api';
import { QuotaBanner } from '../components/QuotaBanner';

export default function Dashboard() {
  const [quota, setQuota] = React.useState<any>(null);
  React.useEffect(() => { getQuota().then(setQuota).catch(console.error); }, []);
  return <div className="space-y-4"><QuotaBanner quota={quota} />{/* ...rest */}</div>;
} 