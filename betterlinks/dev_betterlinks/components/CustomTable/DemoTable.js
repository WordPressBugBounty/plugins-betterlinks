import ResizableTable, { Column } from './ResizableTable';

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Developer', salary: 85000, department: 'Engineering' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Designer', salary: 78000, department: 'Design' },
  { id: 3, name: 'Michael Johnson', email: 'michael.j@example.com', role: 'Product Manager', salary: 95000, department: 'Product' },
  { id: 4, name: 'Emily Brown', email: 'emily.brown@example.com', role: 'Developer', salary: 82000, department: 'Engineering' },
  { id: 5, name: 'David Wilson', email: 'david.w@example.com', role: 'Marketing Manager', salary: 88000, department: 'Marketing' },
  { id: 6, name: 'Sarah Davis', email: 'sarah.davis@example.com', role: 'Data Analyst', salary: 75000, department: 'Analytics' },
  { id: 7, name: 'Robert Taylor', email: 'robert.t@example.com', role: 'Senior Developer', salary: 98000, department: 'Engineering' },
  { id: 8, name: 'Lisa Anderson', email: 'lisa.a@example.com', role: 'UX Designer', salary: 80000, department: 'Design' },
  { id: 9, name: 'James Martinez', email: 'james.m@example.com', role: 'Sales Manager', salary: 92000, department: 'Sales' },
  { id: 10, name: 'Jennifer Lee', email: 'jennifer.l@example.com', role: 'HR Manager', salary: 85000, department: 'Human Resources' },
];

const columns = [
  { key: 'id', label: 'ID', width: 80, minWidth: 60, sortable: true },
  { key: 'name', label: 'Name', width: 180, minWidth: 120, sortable: true },
  { key: 'email', label: 'Email', width: 240, minWidth: 150, sortable: true },
  { key: 'role', label: 'Role', width: 180, minWidth: 120, sortable: true },
  { key: 'salary', label: 'Salary', width: 120, minWidth: 100, sortable: true },
  { key: 'department', label: 'Department', width: 180, minWidth: 120, sortable: true },
];

function DemoTable() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resizable Data Table</h1>
          <p className="text-gray-600">
            Drag column borders to resize • Click headers to sort • Fully responsive
          </p>
        </div>

        <ResizableTable
          columns={columns}
          data={sampleData}
          defaultSortKey="name"
          defaultSortDirection="asc"
        />
      </div>
    </div>
  );
}

export default DemoTable;
