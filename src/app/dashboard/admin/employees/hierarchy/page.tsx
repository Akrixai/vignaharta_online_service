'use client';

import EmployeeHierarchyTree from '@/components/admin/EmployeeHierarchyTree';
import { useRouter } from 'next/navigation';

export default function EmployeeHierarchyPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Hierarchy</h1>
          <p className="text-gray-600 mt-2">
            View and manage your organizational structure
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/employees/create')}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
        >
          Add Employee
        </button>
      </div>

      <EmployeeHierarchyTree />
    </div>
  );
}
