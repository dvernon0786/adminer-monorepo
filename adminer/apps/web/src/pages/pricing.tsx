import { useNavigate } from 'react-router-dom';
import Pricing from '../components/homepage/Pricing';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
        <Pricing />
      </div>
    </div>
  );
}