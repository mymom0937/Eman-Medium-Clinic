import { PageLoader } from '@/components/common/loading-spinner';
import Navbar from '@/components/Navbar';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-[60vh]">
        <PageLoader text="Loading Application..." />
      </div>
    </div>
  );
} 