import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@clerk/vue';
import Home from '@/views/Home.vue';
import Dashboard from '@/views/Dashboard.vue';
import SignIn from '@/views/auth/SignIn.vue';
import UserManagement from '@/views/admin/UserManagement.vue';
import FolhasObraModule from '@/views/folhas-obra/FolhasObraModule.vue';
import FolhasObraList from '@/views/folhas-obra/FolhasObraList.vue';
import FolhasObraDetail from '@/views/folhas-obra/FolhasObraDetail.vue';
import FolhaObraForm from '@/views/folhas-obra/FolhaObraForm.vue';
import ContratosModule from '@/views/contratos/ContratosModule.vue';
import ContratosList from '@/views/contratos/ContratosList.vue';
import ContratoDetail from '@/views/contratos/ContratoDetail.vue';
import ContratoForm from '@/views/contratos/ContratoForm.vue';
import ClientesModule from '@/views/clientes/ClientesModule.vue';
import ClientesList from '@/views/clientes/ClientesList.vue';
import ClienteDetail from '@/views/clientes/ClienteDetail.vue';
import ClienteForm from '@/views/clientes/ClienteForm.vue';
import AssistenciasRemotasModule from '@/views/assistencias-remotas/AssistenciasRemotasModule.vue';
import AssistenciasRemotasList from '@/views/assistencias-remotas/AssistenciasRemotasList.vue';
import AssistenciasRemotasDetail from '@/views/assistencias-remotas/AssistenciasRemotasDetail.vue';
import AssistenciasRemotasForm from '@/views/assistencias-remotas/AssistenciasRemotasForm.vue';
import AgendamentosModule from '@/views/agendamentos/AgendamentosModule.vue';
import AgendamentosList from '@/views/agendamentos/AgendamentosList.vue';
import AgendamentosDetail from '@/views/agendamentos/AgendamentosDetail.vue';
import AgendamentosForm from '@/views/agendamentos/AgendamentosForm.vue';
import LicencasModule from '@/views/licencas/LicencasModule.vue';
import LicencasList from '@/views/licencas/LicencasList.vue';
import LicencasDetail from '@/views/licencas/LicencasDetail.vue';
import LicencasForm from '@/views/licencas/LicencasForm.vue';
import ContaCorrenteModule from '@/views/conta-corrente/ContaCorrenteModule.vue';
import ContaCorrenteList from '@/views/conta-corrente/ContaCorrenteList.vue';
import ContaCorrenteDetail from '@/views/conta-corrente/ContaCorrenteDetail.vue';
import ContaCorrenteForm from '@/views/conta-corrente/ContaCorrenteForm.vue';
import RegistoDiarioAtividadeModule from '@/views/registo-diario-atividade/RegistoDiarioAtividadeModule.vue';
import RegistoDiarioAtividadeList from '@/views/registo-diario-atividade/RegistoDiarioAtividadeList.vue';
import RegistoDiarioAtividadeDetail from '@/views/registo-diario-atividade/RegistoDiarioAtividadeDetail.vue';
import RegistoDiarioAtividadeForm from '@/views/registo-diario-atividade/RegistoDiarioAtividadeForm.vue';
import InstalacoesModule from '@/views/instalacoes-programacoes/InstalacoesModule.vue';
import InstalacoesList from '@/views/instalacoes-programacoes/InstalacoesList.vue';
import InstalacoesDetail from '@/views/instalacoes-programacoes/InstalacoesDetail.vue';
import InstalacoesForm from '@/views/instalacoes-programacoes/InstalacoesForm.vue';
import EquipamentoUsadoModule from '@/views/equipamento-usado/EquipamentoUsadoModule.vue';
import EquipamentoUsadoList from '@/views/equipamento-usado/EquipamentoUsadoList.vue';
import EquipamentoUsadoDetail from '@/views/equipamento-usado/EquipamentoUsadoDetail.vue';
import EquipamentoUsadoForm from '@/views/equipamento-usado/EquipamentoUsadoForm.vue';
import EquipaModule from '@/views/equipa/EquipaModule.vue';
import EquipaList from '@/views/equipa/EquipaList.vue';
import EquipaDetail from '@/views/equipa/EquipaDetail.vue';
import EquipaForm from '@/views/equipa/EquipaForm.vue';

// Router configuration
const routes = [
  // Authentication routes (public)
  {
    path: '/sign-in',
    name: 'SignIn',
    component: SignIn,
    meta: { requiresAuth: false },
  },

  // Admin routes (requires admin role)
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  // Protected routes
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      requiresAuth: true,
      title: 'Início',
      description: 'Página inicial do sistema',
    },
  },
  {
    path: '/dashboard',
    component: Dashboard,
    name: 'dashboard',
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
      description: 'Painel de controle',
    },
  },
  // Folhas de Obra - Custom module component
  {
    path: '/folhas-obra',
    component: FolhasObraModule,
    name: 'folhas-obra',
    meta: {
      title: 'Folhas de Obra',
      description: 'Gestão de folhas de obra',
    },
  },
  // Folhas de Obra specific routes
  {
    path: '/folhas-obra/list',
    component: FolhasObraList,
    name: 'folhas-obra-list',
    meta: {
      title: 'Lista de Folhas de Obra',
      description: 'Lista de todas as folhas de obra',
    },
  },
  {
    path: '/folhas-obra/new',
    component: FolhaObraForm,
    name: 'folhas-obra-new',
    meta: {
      title: 'Nova Folha de Obra',
      description: 'Criar uma nova folha de obra',
    },
  },
  {
    path: '/folhas-obra/:id/edit',
    component: FolhaObraForm,
    name: 'folhas-obra-edit',
    meta: {
      title: 'Editar Folha de Obra',
      description: 'Editar uma folha de obra existente',
    },
  },
  {
    path: '/folhas-obra/:id',
    component: FolhasObraDetail,
    name: 'folhas-obra-detail',
    meta: {
      title: 'Detalhes da Folha de Obra',
      description: 'Detalhes de uma folha de obra específica',
    },
  },
  // Gestor de Contratos - Custom module component
  {
    path: '/gestor-contratos',
    component: ContratosModule,
    name: 'gestor-contratos',
    meta: {
      title: 'Gestor de Contratos',
      description: 'Gestão de contratos',
    },
  },
  // Contratos specific routes
  {
    path: '/contratos/list',
    component: ContratosList,
    name: 'contratos-list',
    meta: {
      title: 'Lista de Contratos',
      description: 'Lista de todos os contratos',
    },
  },
  {
    path: '/contratos/new',
    component: ContratoForm,
    name: 'contratos-new',
    meta: {
      title: 'Novo Contrato',
      description: 'Criar um novo contrato',
    },
  },
  {
    path: '/contratos/:id/edit',
    component: ContratoForm,
    name: 'contratos-edit',
    meta: {
      title: 'Editar Contrato',
      description: 'Editar um contrato existente',
    },
  },
  {
    path: '/contratos/:id',
    component: ContratoDetail,
    name: 'contratos-detail',
    meta: {
      title: 'Detalhes do Contrato',
      description: 'Detalhes de um contrato específico',
    },
  },
  // Clientes - Custom module component
  {
    path: '/clientes',
    component: ClientesModule,
    name: 'clientes',
    meta: {
      title: 'Clientes',
      description: 'Gestão de clientes',
    },
  },
  // Clientes specific routes
  {
    path: '/clientes/list',
    component: ClientesList,
    name: 'clientes-list',
    meta: {
      title: 'Lista de Clientes',
      description: 'Lista de todos os clientes',
    },
  },
  {
    path: '/clientes/new',
    component: ClienteForm,
    name: 'clientes-new',
    meta: {
      title: 'Novo Cliente',
      description: 'Criar um novo cliente',
    },
  },
  {
    path: '/clientes/:id/edit',
    component: ClienteForm,
    name: 'clientes-edit',
    meta: {
      title: 'Editar Cliente',
      description: 'Editar um cliente existente',
    },
  },
  {
    path: '/clientes/:id',
    component: ClienteDetail,
    name: 'clientes-detail',
    meta: {
      title: 'Detalhes do Cliente',
      description: 'Detalhes de um cliente específico',
    },
  },
  // Assistências Remotas - Custom module component
  {
    path: '/assistencias-remotas',
    component: AssistenciasRemotasModule,
    name: 'assistencias-remotas',
    meta: {
      title: 'Assistências Remotas',
      description: 'Gestão de assistências remotas',
    },
  },
  // Assistências Remotas specific routes
  {
    path: '/assistencias-remotas/list',
    component: AssistenciasRemotasList,
    name: 'assistencias-remotas-list',
    meta: {
      title: 'Lista de Assistências Remotas',
      description: 'Lista de todas as assistências remotas',
    },
  },
  {
    path: '/assistencias-remotas/new',
    component: AssistenciasRemotasForm,
    name: 'assistencias-remotas-new',
    meta: {
      title: 'Nova Assistência Remota',
      description: 'Criar uma nova assistência remota',
    },
  },
  {
    path: '/assistencias-remotas/:id/edit',
    component: AssistenciasRemotasForm,
    name: 'assistencias-remotas-edit',
    meta: {
      title: 'Editar Assistência Remota',
      description: 'Editar uma assistência remota existente',
    },
  },
  {
    path: '/assistencias-remotas/:id',
    component: AssistenciasRemotasDetail,
    name: 'assistencias-remotas-detail',
    meta: {
      title: 'Detalhes da Assistência Remota',
      description: 'Detalhes de uma assistência remota específica',
    },
  },
  // Agendamentos - Custom module component
  {
    path: '/agendamentos',
    component: AgendamentosModule,
    name: 'agendamentos',
    meta: {
      title: 'Agendamentos',
      description: 'Gestão de agendamentos',
    },
  },
  // Agendamentos specific routes
  {
    path: '/agendamentos/list',
    component: AgendamentosList,
    name: 'agendamentos-list',
    meta: {
      title: 'Lista de Agendamentos',
      description: 'Lista de todos os agendamentos',
    },
  },
  {
    path: '/agendamentos/new',
    component: AgendamentosForm,
    name: 'agendamentos-new',
    meta: {
      title: 'Novo Agendamento',
      description: 'Criar um novo agendamento',
    },
  },
  {
    path: '/agendamentos/:year/:id/edit',
    component: AgendamentosForm,
    name: 'agendamentos-edit',
    meta: {
      title: 'Editar Agendamento',
      description: 'Editar um agendamento existente',
    },
  },
  {
    path: '/agendamentos/:year/:id',
    component: AgendamentosDetail,
    name: 'agendamentos-detail',
    meta: {
      title: 'Detalhes do Agendamento',
      description: 'Detalhes de um agendamento específico',
    },
  },
  // Gestor de Licenças - Custom module component
  {
    path: '/gestor-licencas',
    component: LicencasModule,
    name: 'gestor-licencas',
    meta: {
      title: 'Gestor de Licenças',
      description: 'Gestão de licenças de software',
    },
  },
  // Licenças specific routes
  {
    path: '/licencas/list',
    component: LicencasList,
    name: 'licencas-list',
    meta: {
      title: 'Lista de Licenças',
      description: 'Lista de todas as licenças',
    },
  },
  {
    path: '/licencas/new',
    component: LicencasForm,
    name: 'licencas-new',
    meta: {
      title: 'Nova Licença',
      description: 'Criar uma nova licença',
    },
  },
  {
    path: '/licencas/:year/:id/edit',
    component: LicencasForm,
    name: 'licencas-edit',
    meta: {
      title: 'Editar Licença',
      description: 'Editar uma licença existente',
    },
  },
  {
    path: '/licencas/:year/:id',
    component: LicencasDetail,
    name: 'licencas-detail',
    meta: {
      title: 'Detalhes da Licença',
      description: 'Detalhes de uma licença específica',
    },
  },
  // Conta Corrente - Custom module component
  {
    path: '/conta-corrente',
    component: ContaCorrenteModule,
    name: 'conta-corrente',
    meta: {
      title: 'Conta Corrente',
      description: 'Gestão de conta corrente de clientes',
    },
  },
  // Conta Corrente specific routes
  {
    path: '/conta-corrente/list',
    component: ContaCorrenteList,
    name: 'conta-corrente-list',
    meta: {
      title: 'Lista de Conta Corrente',
      description: 'Lista de todos os registos de conta corrente',
    },
  },
  {
    path: '/conta-corrente/new',
    component: ContaCorrenteForm,
    name: 'conta-corrente-new',
    meta: {
      title: 'Novo Registo de Conta Corrente',
      description: 'Criar um novo registo de conta corrente',
    },
  },
  {
    path: '/conta-corrente/:year/:id/edit',
    component: ContaCorrenteForm,
    name: 'conta-corrente-edit',
    meta: {
      title: 'Editar Conta Corrente',
      description: 'Editar um registo de conta corrente existente',
    },
  },
  {
    path: '/conta-corrente/:year/:id',
    component: ContaCorrenteDetail,
    name: 'conta-corrente-detail',
    meta: {
      title: 'Detalhes da Conta Corrente',
      description: 'Detalhes de um registo de conta corrente específico',
    },
  },
  // Registo Diário de Atividade - Custom module component
  {
    path: '/registo-diario',
    component: RegistoDiarioAtividadeModule,
    name: 'registo-diario',
    meta: {
      title: 'Registo Diário de Atividade',
      description: 'Gestão de registos diários de atividades',
    },
  },
  // Registo Diário de Atividade specific routes
  {
    path: '/registo-diario-atividade/list',
    component: RegistoDiarioAtividadeList,
    name: 'registo-diario-atividade-list',
    meta: {
      title: 'Lista de Registos Diários',
      description: 'Lista de todos os registos diários de atividade',
    },
  },
  {
    path: '/registo-diario-atividade/new',
    component: RegistoDiarioAtividadeForm,
    name: 'registo-diario-atividade-new',
    meta: {
      title: 'Novo Registo Diário',
      description: 'Criar um novo registo de atividade diária',
    },
  },
  {
    path: '/registo-diario-atividade/:year/:id/edit',
    component: RegistoDiarioAtividadeForm,
    name: 'registo-diario-atividade-edit',
    meta: {
      title: 'Editar Registo Diário',
      description: 'Editar um registo de atividade existente',
    },
  },
  {
    path: '/registo-diario-atividade/:year/:id',
    component: RegistoDiarioAtividadeDetail,
    name: 'registo-diario-atividade-detail',
    meta: {
      title: 'Detalhes do Registo Diário',
      description: 'Detalhes de um registo de atividade específico',
    },
  },
  // Instalações e Programações - Custom module component
  {
    path: '/instalacoes-programacoes',
    component: InstalacoesModule,
    name: 'instalacoes-programacoes',
    meta: {
      title: 'Instalações e Programações',
      description: 'Gestão de instalações e programações de equipamentos',
    },
  },
  // Instalações e Programações specific routes
  {
    path: '/instalacoes-programacoes/list',
    component: InstalacoesList,
    name: 'instalacoes-list',
    meta: {
      title: 'Lista de Instalações',
      description: 'Lista de todas as instalações e programações',
    },
  },
  {
    path: '/instalacoes-programacoes/new',
    component: InstalacoesForm,
    name: 'instalacao-form',
    meta: {
      title: 'Nova Instalação',
      description: 'Criar uma nova instalação e programação',
    },
  },
  {
    path: '/instalacoes-programacoes/:year/:id/edit',
    component: InstalacoesForm,
    name: 'instalacao-edit',
    meta: {
      title: 'Editar Instalação',
      description: 'Editar uma instalação existente',
    },
  },
  {
    path: '/instalacoes-programacoes/:year/:id',
    component: InstalacoesDetail,
    name: 'instalacao-detail',
    meta: {
      title: 'Detalhes da Instalação',
      description: 'Detalhes de uma instalação específica',
    },
  },
  // Equipamento Usado - Custom module component
  {
    path: '/equipamento-usado',
    component: EquipamentoUsadoModule,
    name: 'equipamento-usado',
    meta: {
      title: 'Empréstimo de Equipamentos',
      description: 'Gestão de equipamentos em empréstimo e controlo de stock',
    },
  },
  // Equipamento Usado specific routes
  {
    path: '/equipamento-usado/list',
    component: EquipamentoUsadoList,
    name: 'equipamento-usado-list',
    meta: {
      title: 'Lista de Equipamentos',
      description: 'Lista de todos os equipamentos',
    },
  },
  {
    path: '/equipamento-usado/new',
    component: EquipamentoUsadoForm,
    name: 'equipamento-usado-form',
    meta: {
      title: 'Novo Equipamento',
      description: 'Registar um novo equipamento',
    },
  },
  {
    path: '/equipamento-usado/:year/:id/edit',
    component: EquipamentoUsadoForm,
    name: 'equipamento-usado-edit',
    meta: {
      title: 'Editar Equipamento',
      description: 'Editar um equipamento existente',
    },
  },
  {
    path: '/equipamento-usado/:year/:id',
    component: EquipamentoUsadoDetail,
    name: 'equipamento-usado-detail',
    meta: {
      title: 'Detalhes do Equipamento',
      description: 'Detalhes de um equipamento específico',
    },
  },
  // Equipa - Custom module component
  {
    path: '/equipa',
    component: EquipaModule,
    name: 'equipa',
    meta: {
      title: 'Equipa',
      description: 'Gestão da equipa',
    },
  },
  // Equipa specific routes
  {
    path: '/equipa/list',
    component: EquipaList,
    name: 'equipa-list',
    meta: {
      title: 'Lista de Colaboradores',
      description: 'Lista de todos os colaboradores',
    },
  },
  {
    path: '/equipa/new',
    component: EquipaForm,
    name: 'equipa-new',
    meta: {
      title: 'Novo Colaborador',
      description: 'Adicionar um novo colaborador',
    },
  },
  {
    path: '/equipa/:id/edit',
    component: EquipaForm,
    name: 'equipa-edit',
    meta: {
      title: 'Editar Colaborador',
      description: 'Editar um colaborador existente',
    },
  },
  {
    path: '/equipa/:id',
    component: EquipaDetail,
    name: 'equipa-detail',
    meta: {
      title: 'Detalhes do Colaborador',
      description: 'Detalhes de um colaborador específico',
    },
  },
  // 404 catch-all route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when changing routes
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Set document title based on route meta
  if (to.meta.title) {
    document.title = `${to.meta.title} - Clever`;
  } else {
    document.title = 'Clever';
  }

  // Check authentication requirements
  const { isSignedIn, user, isLoaded } = useAuth();

  // Wait for auth to load with timeout
  let waitCount = 0;
  while (!isLoaded.value && waitCount < 30) {
    // Max 3 seconds wait
    await new Promise(resolve => setTimeout(resolve, 100));
    waitCount++;
  }

  const requiresAuth = to.meta.requiresAuth !== false; // Default to requiring auth
  const requiresAdmin = to.meta.requiresAdmin === true;
  const isPublicRoute = to.meta.requiresAuth === false;

  console.log('Navigation Guard:', {
    to: to.path,
    from: from.path,
    isSignedIn: isSignedIn.value,
    isLoaded: isLoaded.value,
    requiresAuth,
    isPublicRoute,
  });

  // If auth is still loading, allow navigation to continue
  if (!isLoaded.value) {
    console.log('Auth still loading, allowing navigation');
    next();
    return;
  }

  // If route requires auth and user is not signed in
  if (requiresAuth && !isSignedIn.value) {
    console.log('Redirecting to sign-in - user not authenticated');
    if (to.path !== '/sign-in') {
      next('/sign-in');
      return;
    }
  }

  // If user is signed in and trying to access auth pages, redirect to home
  if (isSignedIn.value && to.path === '/sign-in') {
    console.log('User signed in, redirecting to home');
    next('/');
    return;
  }

  // Check admin requirements
  if (requiresAdmin && (!user.value || user.value.publicMetadata?.role !== 'admin')) {
    console.log('Admin access required but user is not admin');
    next('/');
    return;
  }

  console.log('Navigation allowed');
  next();
});

// Error handling
router.onError(error => {
  console.error('Router error:', error);
});

export default router;
