export const mockStats = {
  balance: 124500,
  monthlyRevenue: 45200,
  monthlyExpenses: 28400,
  revenueGrowth: 12.5,
  portfolioHealth: 94.2,
  totalHours: 1240,
  billableHoursPercentage: 84.5,
  totalClients: 24,
  totalProjects: 12,
  alertsCount: 3,
  projectsAtRisk: 2
};

export const mockProjectHealth = [
  { name: 'En Tiempo', value: 12, color: '#FFD166' },
  { name: 'En Riesgo', value: 3, color: '#222222' },
  { name: 'Retrasado', value: 1, color: '#EF4444' }
];

export const mockClients = [
  {
    id: '1',
    name: 'TechFlow Solutions',
    company: 'TechFlow S.L.',
    contact: 'Alex Rivera',
    industry: 'Software',
    email: 'contacto@techflow.com',
    projects: 3,
    totalSpent: 45000,
    status: 'Activo',
    lastActive: 'Hoy'
  },
  {
    id: '2',
    name: 'Global Retail Corp',
    company: 'Global Retail S.A.',
    contact: 'Sofia López',
    industry: 'Logística',
    email: 'info@globalretail.com',
    projects: 1,
    totalSpent: 12500,
    status: 'Pendiente',
    lastActive: 'Ayer'
  },
  {
    id: '3',
    name: 'Innovate Med',
    company: 'Innovate Med SL',
    contact: 'Mark Johnson',
    industry: 'Salud',
    email: 'admin@innovatemed.com',
    projects: 5,
    totalSpent: 89000,
    status: 'Activo',
    lastActive: 'Hace 2 días'
  }
];

export const mockProjects = [
  {
    id: '1',
    name: 'Rebranding Corporativo',
    client: 'Innovate Med',
    budget: 15000,
    progress: 75,
    status: 'En Progreso',
    dueDate: '15 Nov 2023',
    team: 2,
    cm: '32%',
    members: [
      { name: 'JP', color: '#FFD166' },
      { name: 'MR', color: '#222222' }
    ]
  },
  {
    id: '2',
    name: 'App Móvil Delivery',
    client: 'Global Retail Corp',
    budget: 28000,
    progress: 45,
    status: 'En Riesgo',
    dueDate: '12 Dic 2023',
    team: 4,
    cm: '-8%',
    members: [
      { name: 'CG', color: '#FFD166' },
      { name: 'SL', color: '#222222' },
      { name: 'AR', color: '#FFD166' }
    ]
  },
  {
    id: '3',
    name: 'E-commerce Moda',
    client: 'TechFlow Solutions',
    budget: 42000,
    progress: 90,
    status: 'Completado',
    dueDate: '01 Nov 2023',
    team: 3,
    cm: '45%',
    members: [
      { name: 'JP', color: '#FFD166' },
      { name: 'CG', color: '#222222' }
    ]
  }
];

export const mockTasks = [
  { id: 't1', title: 'Diseño de logotipo y manual de marca', project: 'Rebranding Corporativo', status: 'done', priority: 'Alta', comments: 12, attachments: 3, dueDate: 'Completado' },
  { id: 't2', title: 'Implementación de pasarela de pagos', project: 'App Móvil Delivery', status: 'in-progress', priority: 'Alta', comments: 5, attachments: 1, dueDate: 'Mañana' },
  { id: 't3', title: 'Reunión de seguimiento semanal', project: 'E-commerce Moda', status: 'todo', priority: 'Media', comments: 0, attachments: 0, dueDate: 'Lunes' },
  { id: 't4', title: 'Ajustes de UI en Carrito de Compras', project: 'E-commerce Moda', status: 'review', priority: 'Media', comments: 8, attachments: 5, dueDate: 'Hoy' },
  { id: 't5', title: 'Preparar presentación de Presupuesto', project: 'General', status: 'todo', priority: 'Alta', comments: 2, attachments: 1, dueDate: 'Miércoles' },
];

export const mockTransactions = [
  { id: 'inv-412', description: 'Factura Mensual - Octubre', amount: 4500, type: 'income', date: '24 Oct 2023', status: 'Pagado' },
  { id: 'exp-123', description: 'Licencias Adobe Creative Cloud', amount: 150, type: 'expense', date: '22 Oct 2023', status: 'Pagado' },
  { id: 'inv-411', description: 'Web Development Phase 1', amount: 8200, type: 'income', date: '18 Oct 2023', status: 'Pagado' },
  { id: 'exp-122', description: 'Servidores AWS', amount: 450, type: 'expense', date: '15 Oct 2023', status: 'Pendiente' },
];

export const mockAlerts = [
  { id: '1', title: 'Presupuesto excedido', description: 'El proyecto App Móvil ha superado el 90% del presupuesto.', type: 'Warning', date: 'Hace 1 hora' },
  { id: '2', title: 'Nueva tarea asignada', description: 'Tienes 4 nuevas tareas en el tablero Kanban.', type: 'Info', date: 'Hace 3 horas' },
  { id: '3', title: 'Factura pendiente', description: 'La factura #412 está próxima a vencer.', type: 'Error', date: 'Hace 1 día' },
];

export const mockNotebooks = [
  { id: 'nb1', title: 'Estrategia Growth 2024', status: 'Active', pages: 12 },
  { id: 'nb2', title: 'Research Mercado IA', status: 'Review', pages: 45 },
  { id: 'nb3', title: 'Brand Guidelines v2', status: 'Draft', pages: 8 },
];
