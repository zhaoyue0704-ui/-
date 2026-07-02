import React, { useState } from 'react';
import { 
  StudyPlan, 
  StudentProfile, 
  ClassStudentProgress, 
  StudentFeedback,
  UserStage,
  Question,
  PlanPhase
} from '../types';
import { 
  Users, 
  Plus, 
  Settings, 
  Clipboard, 
  BarChart, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft, 
  ChevronRight, 
  Calendar, 
  Search,
  Filter,
  Check,
  X,
  Book,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Mail,
  Sliders,
  BellRing
} from 'lucide-react';

interface AdminViewsProps {
  currentView: string;
  setView: (view: string) => void;
  plans: StudyPlan[];
  setPlans: React.Dispatch<React.SetStateAction<StudyPlan[]>>;
  classProgress: ClassStudentProgress[];
  setClassProgress: React.Dispatch<React.SetStateAction<ClassStudentProgress[]>>;
  feedbacks: StudentFeedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<StudentFeedback[]>>;
  questions: Question[];
}

export const AdminViews: React.FC<AdminViewsProps> = ({
  currentView,
  setView,
  plans,
  setPlans,
  classProgress,
  setClassProgress,
  feedbacks,
  setFeedbacks,
  questions
}) => {
  // Local toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // A2 (Student Manager) Local State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentStage, setNewStudentStage] = useState<UserStage>('医科本科生');

  // A4 (Plan Creator) Local Wizard Step State
  const [creationStep, setCreationStep] = useState(1);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanTarget, setNewPlanTarget] = useState('执业医师资格考试');
  const [newPlanStage, setNewPlanStage] = useState<UserStage>('医科本科生');
  const [newPlanDuration, setNewPlanDuration] = useState('30天');
  const [newPlanSyllabus, setNewPlanSyllabus] = useState<string[]>(['心血管系统']);
  const [newPlanPhases, setNewPlanPhases] = useState<PlanPhase[]>([
    { id: 'np_1', name: '阶段 1：基础生理与病理核心考点', type: 'practice', questionCount: 2, difficulty: '易', requirement: '正确率高于 60%' },
    { id: 'np_2', name: '阶段 2：临床疑难病分析测验', type: 'quiz', questionCount: 5, difficulty: '中', requirement: '模拟考试过关' }
  ]);
  const [newPlanRemRules, setNewPlanRemRules] = useState('正确率低于 70% 自动触发 3 道相似考点加练仿真题');

  // A5 (Plan List) Local State
  const [selectedPlanDetailsId, setSelectedPlanDetailsId] = useState<string | null>(null);

  // A6 (Class Monitor) Local State
  const [activePlanFilter, setActivePlanFilter] = useState<string>('plan_01');
  const [selectedStudentDrawerId, setSelectedStudentDrawerId] = useState<string | null>(null);
  const [selectedKPDrawer, setSelectedKPDrawer] = useState<string | null>(null);
  const [monitorTab, setMonitorTab] = useState<'progress' | 'feedbacks'>('progress');
  
  // Feedback resolution local state
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [feedbackReplyContent, setFeedbackReplyContent] = useState('');

  // S9: Syllabus categories data for A3
  const SYLLABUS_TREE = [
    {
      id: 'cat_1',
      name: '心血管系统',
      subjects: ['生理学', '病理诊断学', '内科学'],
      targetMapping: '执业医师 & 西医综合',
      questionCount: 450,
      difficultyDistribution: '易: 30% | 中: 50% | 难: 20%'
    },
    {
      id: 'cat_2',
      name: '呼吸系统',
      subjects: ['病理学', '临床呼吸内科学'],
      targetMapping: '执业医师 & 住培结业考试',
      questionCount: 320,
      difficultyDistribution: '易: 40% | 中: 45% | 难: 15%'
    },
    {
      id: 'cat_3',
      name: '药理学与治疗基础',
      subjects: ['基础药理学', '临床合理用药'],
      targetMapping: '通用大纲',
      questionCount: 280,
      difficultyDistribution: '易: 20% | 中: 60% | 难: 20%'
    }
  ];

  // A2 Handler: Add Student Profile Mock
  const handleAddStudentSubmit = () => {
    if (!newStudentName.trim()) return;
    
    const newStudentId = 'std_mock_' + Date.now();
    
    // Add to Class Student progress
    const newProgress: ClassStudentProgress = {
      studentId: newStudentId,
      name: newStudentName,
      stage: newStudentStage,
      planId: 'plan_01', // Default assigned to plan 1 for demo
      progress: 0,
      avgCorrectRate: 0,
      testScore: null,
      weakPoints: [],
      remediationStatus: '未触发',
      remediationImprovement: null,
      lastActive: '刚刚'
    };

    setClassProgress(prev => [...prev, newProgress]);
    setNewStudentName('');
    setShowAddStudentModal(false);
    showToast('已导入学生');
  };

  // A4 Wizard Handlers
  const handleNextStep = () => {
    if (creationStep === 1 && !newPlanName.trim()) {
      showToast('请输入计划名称', 'warning');
      return;
    }
    setCreationStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCreationStep(prev => prev - 1);
  };

  const handlePublishPlanSubmit = () => {
    const finalPlanId = 'plan_new_' + Date.now();
    const newPlanObj: StudyPlan = {
      id: finalPlanId,
      name: newPlanName,
      target: newPlanTarget,
      stage: newPlanStage,
      duration: newPlanDuration,
      syllabus: newPlanSyllabus,
      phases: newPlanPhases,
      status: 'active',
      studentCount: 0,
      completionRate: 0,
      remediationRules: newPlanRemRules,
      createdAt: new Date().toLocaleDateString()
    };

    setPlans(prev => [...prev, newPlanObj]);
    showToast('已发布');
    
    // Reset wizard
    setCreationStep(1);
    setNewPlanName('');
    setNewPlanSyllabus(['心血管系统']);
    setView('A5'); // Go to Plan manager
  };

  // A5 Handler: Duplicate/Copy Plan
  const handleDuplicatePlan = (planId: string) => {
    const orig = plans.find(p => p.id === planId);
    if (!orig) return;

    const dup: StudyPlan = {
      ...orig,
      id: 'plan_dup_' + Date.now(),
      name: `${orig.name} - 副本`,
      studentCount: 0,
      completionRate: 0,
      createdAt: new Date().toLocaleDateString()
    };

    setPlans(prev => [...prev, dup]);
    showToast('已复制');
  };

  // A6 Handler: Send Notification Reminder (Toast Mock)
  const handleSendReminder = (studentName: string) => {
    showToast('已提醒学生');
  };

  // A6 Handler: Audit feedback submit
  const handleResolveFeedback = (fbId: string) => {
    if (!feedbackReplyContent.trim()) {
      showToast('请填写核实处理意见', 'warning');
      return;
    }

    setFeedbacks(prev => prev.map(f => {
      if (f.id === fbId) {
        return {
          ...f,
          status: 'accepted' as const,
          reply: feedbackReplyContent,
          processedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5)
        };
      }
      return f;
    }));

    setFeedbackReplyContent('');
    setActiveFeedbackId(null);
    showToast('已采纳并更新解析');
  };

  return (
    <div className="p-4 w-full space-y-6 text-gray-800">
      
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-[#1e0000] border-2 border-brand-gold text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-black animate-pulse max-w-md text-center">
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Global Admin Header */}
      <div className="bg-[#8C0000] border-b-4 border-brand-gold text-white rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="z-10">
          <h2 className="font-bold text-sm flex items-center gap-2">
            医学教务考纲管控总台
            <span className="text-[10px] bg-[#3b0000] text-brand-gold border border-brand-gold/20 px-2 py-0.5 rounded font-extrabold uppercase">
              管理员: zhaoyue
            </span>
          </h2>
          <p className="text-[11px] text-brand-lightred mt-1 font-medium">
            维护统考标准大纲，监督各班级习题练习进度与薄弱点补盲反馈。
          </p>
        </div>

        <div className="flex flex-wrap gap-2 z-10">
          <button 
            onClick={() => setView('A4')}
            className="px-3.5 py-1.5 bg-brand-gold hover:bg-amber-600 text-[#3b0000] rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> 创建新计划
          </button>
        </div>
      </div>

      {/* A1 (Admin Home View) */}
      {currentView === 'A1' && (
        <div className="space-y-6 animate-fade-in">
          {/* Management Directory / Working Entries (管理目录 / 工作入口) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-brand-red" />
                管理目录 / 工作入口
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: '学生管理', desc: '学生进度与学籍', viewId: 'A2', color: 'bg-rose-50 hover:bg-rose-100/60 border-rose-100 text-rose-800' },
                { label: '大纲配置', desc: '统考医学大纲配置树', viewId: 'A3', color: 'bg-amber-50 hover:bg-amber-100/60 border-amber-100 text-amber-800' },
                { label: '创建计划', desc: '新备考大纲创建步骤', viewId: 'A4', color: 'bg-sky-50 hover:bg-sky-100/60 border-sky-100 text-sky-800' },
                { label: '计划发布', desc: '分拨与发布总控中心', viewId: 'A5', color: 'bg-indigo-50 hover:bg-indigo-100/60 border-indigo-100 text-indigo-800' },
                { label: '学情看板', desc: '全班维度数据双下钻', viewId: 'A6', color: 'bg-orange-50 hover:bg-orange-100/60 border-orange-100 text-orange-800' },
                { label: '反馈核实', desc: '学生题目报错核对', action: () => { setView('A6'); setMonitorTab('feedbacks'); }, color: 'bg-emerald-50 hover:bg-emerald-100/60 border-emerald-100 text-emerald-800' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.action) item.action();
                    else if (item.viewId) setView(item.viewId);
                  }}
                  className={`p-3 border rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${item.color}`}
                >
                  <span className="text-2xs font-bold block">{item.label}</span>
                  <span className="text-[10px] text-gray-400 mt-1 line-clamp-1">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border-t-4 border-brand-red border-x border-b border-brand-borderred/20 p-4.5 rounded-lg shadow-2xs">
              <span className="text-3xs font-extrabold text-gray-400 block uppercase tracking-wider">活跃医学学生</span>
              <div className="text-2xl font-black text-brand-darkred mt-1 font-sans">{classProgress.length} <span className="text-2xs font-bold text-gray-500">人</span></div>
              <p className="text-3xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-2.5 inline-block font-extrabold">周同比 ＋12.4% 稳健增长</p>
            </div>
            <div className="bg-white border-t-4 border-brand-gold border-x border-b border-brand-borderred/20 p-4.5 rounded-lg shadow-2xs">
              <span className="text-3xs font-extrabold text-gray-400 block uppercase tracking-wider">大纲计划平均完成率</span>
              <div className="text-2xl font-black text-brand-darkred mt-1 font-mono">68.5%</div>
              <p className="text-3xs text-brand-red bg-brand-lightred/30 border border-brand-borderred/10 px-1.5 py-0.5 rounded mt-2.5 inline-block font-extrabold">当前共有 4 个激活大纲</p>
            </div>
            <div className="bg-white border-t-4 border-emerald-700 border-x border-b border-brand-borderred/20 p-4.5 rounded-lg shadow-2xs">
              <span className="text-3xs font-extrabold text-gray-400 block uppercase tracking-wider">统考模拟测试合格率</span>
              <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">82.1%</div>
              <p className="text-3xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-2.5 inline-block font-extrabold">国家达标门槛：80.0%</p>
            </div>
            <div className="bg-white border-t-4 border-brand-darkred border-x border-b border-brand-borderred/20 p-4.5 rounded-lg shadow-2xs">
              <span className="text-3xs font-extrabold text-gray-400 block uppercase tracking-wider">待教研核对题目纠错</span>
              <div className="text-2xl font-black text-brand-red mt-1 font-mono">
                {feedbacks.filter(f => f.status === 'pending').length} <span className="text-2xs font-bold text-gray-500">条</span>
              </div>
              <p className="text-3xs text-[#b30000] bg-rose-50 border border-red-100 px-1.5 py-0.5 rounded mt-2.5 inline-block font-extrabold">需核实选项、考纲或解析</p>
            </div>
          </div>

          {/* Action To-dos Alerts */}
          <div className="border border-brand-borderred/30 bg-brand-lightred/20 rounded-lg p-5 space-y-3.5 shadow-2xs">
            <h4 className="text-xs font-bold text-[#8C0000] flex items-center gap-1.5">
              <AlertTriangle className="w-4.5 h-4.5 text-brand-gold" /> 学情预警提醒 (日常待办)
            </h4>

            <div className="divide-y divide-brand-borderred/15 text-xs space-y-2.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2.5">
                <span className="text-gray-700 font-medium text-2xs leading-relaxed">
                  ⚠️ <strong>张同学（std_01）</strong> 阶段模拟测验未达标触发大纲补盲，且超过24小时<strong>尚未启动微课加练</strong>。
                </span>
                <button 
                  onClick={() => handleSendReminder('张同学')}
                  className="px-3 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-3xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  发送提醒消息
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2.5">
                <span className="text-gray-700 font-medium text-2xs leading-relaxed">
                  💬 王小敏（std_03） 在作答【药理学 - 糖皮质激素核心考点】时提交了<strong>1条纠错纠错意见</strong>，质疑标准答案解析。
                </span>
                <button 
                  onClick={() => { setView('A6'); setMonitorTab('feedbacks'); }}
                  className="px-3 py-1.5 bg-[#4d0000] hover:bg-[#2e0000] text-brand-lightred border border-brand-borderred/10 rounded text-3xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  前往题目反馈核实
                </button>
              </div>
            </div>
          </div>

          {/* Weakness analysis top list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-brand-borderred/20 rounded-lg p-5 space-y-4 shadow-2xs">
              <h4 className="text-xs font-black text-brand-darkred flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-brand-red rounded-full" />
                全班级高频高危易错医学考点 (错误率 Top 3)
              </h4>
              
              <div className="space-y-3 text-3xs text-gray-600 font-bold">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-darkred text-2xs font-extrabold">1. 药理学 - 糖皮质激素抗炎机制</span>
                    <span className="text-brand-red font-black text-xs font-mono">65.0%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-brand-red h-1.5 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-darkred text-2xs font-extrabold">2. 诊断学 - 呼吸困难临床体征鉴别</span>
                    <span className="text-brand-gold font-black text-xs font-mono">42.0%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-brand-gold h-1.5 rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-darkred text-2xs font-extrabold">3. 心血管系统 - 急性心肌梗死并发症核心点</span>
                    <span className="text-gray-500 font-black text-xs font-mono">28.0%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gray-300 h-1.5 rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-brand-borderred/20 rounded-lg p-5 space-y-4 shadow-2xs">
              <h4 className="text-xs font-bold text-brand-darkred flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-brand-gold rounded-full" />
                大纲考点补盲成效
              </h4>
              <div className="space-y-4 text-2xs">
                <p className="text-gray-500 leading-relaxed font-medium">
                  大纲匹配辅导本月共派发了 <strong className="text-brand-red">34 个</strong> 针对性的补盲练习题集与微课讲义，涵盖 5 大医学科目。
                </p>
                <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-800 space-y-1.5">
                  <p className="font-extrabold text-emerald-950 text-3xs flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    加练复测正确率平均提升幅度：
                  </p>
                  <p className="text-3xs font-medium leading-relaxed text-emerald-900">
                    学生在阅读考纲核心解析、观看微课并完成针对性练习后，该考点的正确率平均<strong>提升了 28.5%</strong>，补盲成效符合预期。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A2 (Student Manager View) */}
      {currentView === 'A2' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex justify-between items-center pb-2.5 border-b border-brand-borderred/20">
            <h3 className="text-xs font-black text-brand-darkred flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-brand-red" />
              试点考试班级范围学生学籍与进度管理库 ({classProgress.length} 人)
            </h3>
            <button 
              onClick={() => setShowAddStudentModal(true)}
              className="px-3.5 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-3xs font-black flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> 手动批量导入/新增试点学生
            </button>
          </div>

          <div className="overflow-x-auto border border-brand-borderred/20 rounded-lg shadow-2xs">
            <table className="w-full text-left text-3xs border-collapse">
              <thead>
                <tr className="bg-brand-lightred/20 border-b border-brand-borderred/20 text-brand-darkred font-extrabold uppercase tracking-wide">
                  <th className="p-3.5">姓名</th>
                  <th className="p-3.5">身份标签</th>
                  <th className="p-3.5">关联统考大纲</th>
                  <th className="p-3.5">答题通关进度</th>
                  <th className="p-3.5">大纲平均正确率</th>
                  <th className="p-3.5">阶段模拟成绩</th>
                  <th className="p-3.5 text-center">AI补盲干预状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classProgress.map(student => (
                  <tr key={student.studentId} className="hover:bg-brand-lightred/10 transition-colors">
                    <td className="p-3.5 font-extrabold text-gray-800">{student.name}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded-full font-black">
                        {student.stage}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-500 font-semibold truncate max-w-[150px]">执业医师通关强化计划</td>
                    <td className="p-3.5 font-mono font-bold text-gray-600">{student.progress}%</td>
                    <td className="p-3.5 font-mono text-brand-red font-black text-2xs">{student.avgCorrectRate}%</td>
                    <td className="p-3.5 font-extrabold text-gray-700">{student.testScore ? `${student.testScore} 分` : '未完成测验'}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-3xs font-black border uppercase tracking-wider ${
                        student.remediationStatus === '已完成' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        student.remediationStatus === '加练中' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        student.remediationStatus === '已生成未开始' ? 'bg-amber-50 text-brand-gold border-brand-gold/30 font-black' :
                        'bg-gray-50 text-gray-400 border-gray-200 font-medium'
                      }`}>
                        {student.remediationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Student Mock Modal */}
          {showAddStudentModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
              <div className="bg-white rounded-lg p-5.5 max-w-sm w-full border border-brand-borderred/30 space-y-4 text-xs shadow-xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="font-black text-[#8C0000] text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-brand-gold" />
                    录入新增医学试点学生
                  </h4>
                  <button 
                    onClick={() => setShowAddStudentModal(false)} 
                    className="text-gray-400 hover:text-gray-600 font-bold text-base cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-3xs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">学生姓名</label>
                    <input 
                      type="text" 
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="如：孙同修"
                      className="w-full text-xs bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">统考身份大纲级别</label>
                    <select 
                      value={newStudentStage}
                      onChange={(e) => setNewStudentStage(e.target.value as UserStage)}
                      className="w-full text-xs bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="医科本科生">医科本科生</option>
                      <option value="医学研究生">医学研究生</option>
                      <option value="住培医师">住培医师</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-3.5">
                  <button 
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-3.5 py-1.5 border border-gray-200 text-gray-500 rounded text-3xs font-extrabold cursor-pointer"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleAddStudentSubmit}
                    disabled={!newStudentName.trim()}
                    className="px-3.5 py-1.5 bg-brand-red hover:bg-brand-darkred disabled:bg-gray-200 disabled:text-gray-400 text-white rounded text-3xs font-black shadow-xs cursor-pointer transition-colors"
                  >
                    确认录入并分配计划
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* A3 (Syllabus Config View) */}
      {currentView === 'A3' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center pb-2.5 border-b border-brand-borderred/20">
            <div>
              <h3 className="text-xs font-bold text-brand-darkred flex items-center gap-1.5">
                <Book className="w-4.5 h-4.5 text-brand-red" />
                标准医学考试大纲匹配库
              </h3>
              <p className="text-3xs text-gray-500 mt-0.5 font-medium">绑定医学科目与核心考点，作为计划阶段出题和相似题补盲抽取的底层大纲标签体系。</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SYLLABUS_TREE.map(cat => (
              <div key={cat.id} className="border border-brand-borderred/20 rounded-lg p-4.5 bg-white hover:border-brand-borderred hover:shadow-xs transition-all space-y-3.5 text-2xs relative">
                <div className="absolute top-0 right-4 h-1 w-12 bg-brand-red" />
                
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-brand-lightred/30 text-brand-red rounded font-black text-3xs border border-brand-borderred/10">大纲医学章</span>
                  <span className="text-3xs text-gray-400 font-semibold">映射目标：{cat.targetMapping}</span>
                </div>

                <h4 className="font-extrabold text-xs text-brand-darkred">{cat.name}</h4>
                
                <div className="space-y-2 text-gray-600 font-medium text-3xs">
                  <p>涉及基础学科：<strong className="text-gray-800">{cat.subjects.join('、')}</strong></p>
                  <p>系统储备题库量：<strong className="text-brand-red font-bold">{cat.questionCount} 道精编题</strong></p>
                  <p>难度梯度分布：<span className="font-mono text-[#996600] font-bold">{cat.difficultyDistribution}</span></p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-3xs">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded font-extrabold">✓ 考点100%覆盖</span>
                  <button 
                    onClick={() => {
                      alert(`正在调取并映射【${cat.name}】关联的权威第九版全国高等医学教材大纲详细考点定义表。`);
                    }}
                    className="text-brand-red hover:text-brand-darkred font-black cursor-pointer"
                  >
                    细化大纲标签 →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sample Question Fields Spec S9 */}
          <div className="bg-gradient-to-br from-gray-50 to-brand-lightred/10 border border-brand-borderred/20 rounded-lg p-5 space-y-3.5 shadow-2xs">
            <h4 className="text-xs font-black text-[#8C0000] flex items-center gap-1.5">
              <Clipboard className="w-4.5 h-4.5 text-brand-gold fill-brand-gold" /> 医学题库多维字段出题验证标准（精细化教研保障）
            </h4>
            <p className="text-2xs text-gray-600 leading-relaxed font-semibold">
              为确保题目质量与补盲针对性，系统录入的每一道医学题目均强制关联以下多维教研字段，防止滥竽充数、文不对题：
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-3xs text-brand-darkred font-black pt-1.5">
              <span className="bg-white p-2 rounded border border-brand-borderred/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-red" /> 题干描述 (Stem)</span>
              <span className="bg-white p-2 rounded border border-brand-borderred/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-red" /> 题型划分 (A1/A2/B1/X)</span>
              <span className="bg-white p-2 rounded border border-brand-borderred/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-red" /> 备选项集合 (Options)</span>
              <span className="bg-white p-2 rounded border border-brand-borderred/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-red" /> 正确答案 (Answer)</span>
              <span className="bg-white p-2 rounded border border-brand-borderred/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-gold" /> 权威大纲微课解析 (Explanation)</span>
              <span className="bg-white p-2 rounded border border-brand-borderred/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-gold" /> 对应大纲三级考点 (KnowledgePoint)</span>
              <span className="bg-white p-2 rounded border border-brand-borderred/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-gold" /> 难度指标量化 (Difficulty)</span>
              <span className="bg-white p-2 rounded border border-brand-borderred/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-gold" /> 临床科室归口 (Category)</span>
            </div>
          </div>
        </div>
      )}

      {/* A4 (Plan Creator View - Step Wizard) */}
      {currentView === 'A4' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-borderred/20">
            <h3 className="text-xs font-bold text-brand-darkred flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-brand-red" />
              医学统考计划配置向导
            </h3>
          </div>

          {/* Step Progress indicators */}
          <div className="flex items-center justify-between text-3xs border-b border-gray-100 pb-3 overflow-x-auto gap-2 scrollbar-none">
            {[
              { step: 1, label: '1. 计划基本档案' },
              { step: 2, label: '2. 关联大纲考点' },
              { step: 3, label: '3. 强化练习内容' },
              { step: 4, label: '4. 综合测验卷' },
              { step: 5, label: '5. 个性化补盲规则' },
              { step: 6, label: '6. 覆盖发布学生' },
              { step: 7, label: '7. 教研审核发布' }
            ].map(item => (
              <span 
                key={item.step} 
                className={`font-black py-1.5 px-3 rounded whitespace-nowrap border ${
                  creationStep === item.step 
                    ? 'bg-brand-red text-white border-brand-red shadow-2xs font-extrabold' 
                    : creationStep > item.step 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold' 
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
              >
                {item.label}
              </span>
            ))}
          </div>

          {/* Wizard Panel */}
          <div className="bg-white border border-brand-borderred/20 rounded-lg p-5 min-h-[280px] flex flex-col justify-between shadow-2xs">
            {creationStep === 1 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-black text-brand-darkred border-b border-gray-100 pb-2">第一步：填写统考学习计划核心基本档案</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-3xs font-extrabold text-gray-400 uppercase tracking-wider">计划名称</label>
                    <input 
                      type="text" 
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      placeholder="如：2026年执业医师资格证第一阶段冲刺大纲强化计划"
                      className="w-full text-xs bg-gray-50 border border-gray-300 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-3xs font-extrabold text-gray-400 uppercase tracking-wider">适用考试大纲目标</label>
                    <select 
                      value={newPlanTarget}
                      onChange={(e) => setNewPlanTarget(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-300 rounded p-2.5 focus:outline-none"
                    >
                      <option value="执业医师资格考试">临床执业医师资格考试 (综合大纲)</option>
                      <option value="医学研究生入学考试">西医综合研究生入学统一考试 (考研大纲)</option>
                      <option value="住院医师规范化培训结业考试">住院医师规范化培训结业考试 (住培大纲)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-3xs font-extrabold text-gray-400 uppercase tracking-wider">匹配适用学生阶段</label>
                    <select 
                      value={newPlanStage}
                      onChange={(e) => setNewPlanStage(e.target.value as UserStage)}
                      className="w-full text-xs bg-gray-50 border border-gray-300 rounded p-2.5 focus:outline-none"
                    >
                      <option value="医科本科生">医科本科生 / 备考执医</option>
                      <option value="医学研究生">医学研究生 / 备战考研</option>
                      <option value="住培医师">住培医师 / 备考结业</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-3xs font-extrabold text-gray-400 uppercase tracking-wider">建议大纲周期</label>
                    <input 
                      type="text" 
                      value={newPlanDuration}
                      onChange={(e) => setNewPlanDuration(e.target.value)}
                      placeholder="如：30天、45天"
                      className="w-full text-xs bg-gray-50 border border-gray-300 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                    />
                  </div>
                </div>
              </div>
            )}

            {creationStep === 2 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-black text-brand-darkred border-b border-gray-100 pb-2">第二步：选择所涵盖的标准大纲知识考点章节</h4>
                <p className="text-3xs text-gray-500 font-medium leading-relaxed">已自动从标准大纲匹配库中同步章节。勾选即可绑定相关的医学题库和微课解析资源：</p>
                
                <div className="space-y-2 pt-2 grid grid-cols-2 gap-3">
                  {[
                    { name: '心血管系统章节', key: '心血管系统' },
                    { name: '呼吸系统章节', key: '呼吸系统' },
                    { name: '消化系统与病理学', key: '消化系统' },
                    { name: '泌尿系统与药理治疗', key: '泌尿系统' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-brand-lightred/20 hover:border-brand-borderred/20 transition-all">
                      <input 
                        type="checkbox" 
                        checked={newPlanSyllabus.includes(item.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPlanSyllabus(prev => [...prev, item.key]);
                          } else {
                            setNewPlanSyllabus(prev => prev.filter(x => x !== item.key));
                          }
                        }}
                        className="accent-brand-red"
                      />
                      <span className="font-extrabold text-brand-darkred">{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {creationStep === 3 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-black text-brand-darkred border-b border-gray-100 pb-2">第三步：精细化配置计划阶段每日一练/基础练习</h4>
                
                <div className="space-y-3">
                  {newPlanPhases.map((phase, idx) => (
                    <div key={phase.id} className="p-3.5 border border-brand-borderred/15 bg-brand-lightred/10 rounded-lg flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <p className="font-extrabold text-brand-darkred">{phase.name}</p>
                        <p className="text-3xs text-gray-400 font-bold">
                          练习类型：{phase.type === 'practice' ? '日常强化练习' : '仿真模拟考试'} · 题量规模: {phase.questionCount}题 · 难度梯度: {phase.difficulty}
                        </p>
                      </div>
                      <span className="text-3xs bg-brand-gold/20 text-brand-gold border border-brand-gold/30 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        教学阶段 {idx+1}
                      </span>
                    </div>
                  ))}

                  <button 
                    onClick={() => {
                      const newP: PlanPhase = {
                        id: 'np_phase_' + Date.now(),
                        name: `阶段 ${newPlanPhases.length + 1}：新增大纲专题高频强化练习`,
                        type: 'practice',
                        questionCount: 3,
                        difficulty: '中',
                        requirement: '正确率高于 70%'
                      };
                      setNewPlanPhases(prev => [...prev, newP]);
                    }}
                    className="w-full py-2.5 border-2 border-dashed border-brand-borderred/30 hover:border-brand-red bg-white rounded-lg text-center text-brand-red hover:bg-brand-lightred/20 text-2xs font-black cursor-pointer transition-colors"
                  >
                    + 新增一个考纲巩固练习阶段
                  </button>
                </div>
              </div>
            )}

            {creationStep === 4 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-black text-brand-darkred border-b border-gray-100 pb-2">第四步：配置学习计划终结性模拟测验试卷</h4>
                <p className="text-3xs text-gray-500 font-semibold leading-relaxed">您可以让系统基于匹配算法为学生自动仿真组卷，或者手工指派一套经典原题卷：</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 border-2 border-brand-red bg-brand-lightred/10 rounded-lg space-y-1 cursor-pointer">
                    <p className="font-black text-brand-darkred flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
                      1. 大纲题库自动匹配 (推荐)
                    </p>
                    <p className="text-3xs text-gray-500 font-medium leading-relaxed">根据第二步所选的心血管、呼吸系统章节考纲分布，从题库中按比例自动抽取 5 道典型统考题进行全仿真自动组卷。</p>
                  </div>
                  <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg space-y-1 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
                    <p className="font-extrabold text-gray-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      2. 指派已有固定模拟真题卷
                    </p>
                    <p className="text-3xs text-gray-400 leading-relaxed">人工调用历年统考心血管内科大纲强化冲刺试卷资源。</p>
                  </div>
                </div>
              </div>
            )}

            {creationStep === 5 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-black text-brand-darkred border-b border-gray-100 pb-2">第五步：定义个性化 AI 补盲自动触发规则</h4>
                <p className="text-3xs text-gray-500 font-bold leading-relaxed">当试点学生在前面答题及测验未达标时，系统将依此规则自动匹配微课视频解析及生成定向仿真加练：</p>
                
                <div className="space-y-2">
                  <label className="block text-3xs font-extrabold text-gray-400 uppercase tracking-widest">补盲规则文案描述</label>
                  <textarea 
                    rows={3}
                    value={newPlanRemRules}
                    onChange={(e) => setNewPlanRemRules(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-300 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red font-mono"
                  />
                </div>
              </div>
            )}

            {creationStep === 6 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-brand-darkred border-b border-gray-100 pb-2">第六步：选择本学习计划需要覆盖的学生范围</h4>
                <p className="text-3xs text-gray-500 font-medium leading-relaxed">您可以向指定年级或特定班级的学生进行发布：</p>
                
                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer">
                    <input type="radio" name="audience" defaultChecked className="accent-brand-red" />
                    <span className="font-extrabold text-brand-darkred">批量分派：全院符合“{newPlanStage}”级别的已录入学生 (共 {classProgress.length} 人)</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed opacity-40">
                    <input type="radio" name="audience" disabled />
                    <span className="font-semibold text-gray-400">特定教研班级定向派发 (1班、2班)</span>
                  </label>
                </div>
              </div>
            )}

            {creationStep === 7 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-black text-[#8C0000] border-b border-gray-100 pb-2">第七步：发布前教研合规自检清单</h4>
                
                <div className="bg-gradient-to-br from-gray-50 to-brand-lightred/10 border border-brand-borderred/20 p-5 rounded-lg space-y-3 shadow-2xs">
                  <p className="font-black text-brand-darkred text-2xs uppercase tracking-wider">大纲计划配置详情核对：</p>
                  <ul className="list-disc pl-5 text-2xs text-gray-700 space-y-2.5 font-semibold">
                    <li>计划名称：<span className="text-brand-red font-black">《{newPlanName}》</span></li>
                    <li>适用统考：<strong>{newPlanTarget} ({newPlanStage})</strong></li>
                    <li>绑定大纲章节：<strong>{newPlanSyllabus.length} 个科目章 ({newPlanSyllabus.join(', ')})</strong></li>
                    <li>包含大纲强化练习段：<strong>{newPlanPhases.length} 个阶段 (预计匹配题量: {newPlanPhases.reduce((acc, p) => acc + p.questionCount, 0)}题)</strong></li>
                    <li>补盲阈值警戒线：<strong>低于 70% 自动分拨视频微课与相似真题定向冲刺包</strong></li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step Controls */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-6">
              {creationStep > 1 ? (
                <button 
                  onClick={handlePrevStep}
                  className="px-4 py-1.5 border border-brand-borderred/30 hover:bg-brand-lightred/10 text-brand-red rounded text-3xs font-black cursor-pointer transition-colors shadow-2xs"
                >
                  上一步
                </button>
              ) : (
                <div />
              )}

              {creationStep < 7 ? (
                <button 
                  onClick={handleNextStep}
                  className="px-4.5 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-3xs font-black cursor-pointer transition-colors shadow-xs"
                >
                  下一步
                </button>
              ) : (
                <button 
                  onClick={handlePublishPlanSubmit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-3xs font-black shadow-md flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" /> 校验无误，立即全网发布计划
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* A5 (Plan Manager View) */}
      {currentView === 'A5' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center pb-2.5 border-b border-brand-borderred/20">
            <h3 className="text-xs font-black text-brand-darkred flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-brand-red" />
              医学统考学习计划全周期教研仓 ({plans.length} 个正在运作)
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {plans.map(plan => (
              <div key={plan.id} className="border border-brand-borderred/15 rounded-lg bg-white hover:border-brand-borderred hover:shadow-sm transition-all overflow-hidden text-2xs relative">
                <div className="h-1 bg-brand-red w-full" />
                <div className="p-4.5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-brand-lightred/20 text-brand-red rounded font-black text-3xs border border-brand-borderred/10">{plan.target}</span>
                      <span className="text-gray-400 font-semibold">绑定考纲章节: {plan.syllabus.join('、')}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-black text-3xs ${
                      plan.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      plan.status === 'published' ? 'bg-brand-lightred/20 text-brand-red border border-brand-borderred/20' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {plan.status === 'active' ? '进行中 (学生实时答题中)' : plan.status === 'published' ? '已下发' : '教研草稿'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-black text-xs text-brand-darkred">《{plan.name}》</h4>
                    <p className="text-gray-500 font-medium">适用教学对象阶段：<strong className="text-gray-700 font-extrabold">{plan.stage}</strong> · 周期大纲：{plan.duration} · 配置阶段数：{plan.phases.length}个章节段</p>
                  </div>

                  {/* Simulated Stats for existing plan */}
                  {plan.studentCount > 0 && (
                    <div className="grid grid-cols-3 gap-3 py-2.5 bg-gradient-to-r from-gray-50 to-brand-lightred/5 rounded-lg p-3 text-3xs text-gray-500 font-semibold">
                      <div className="border-r border-gray-100">全班大纲平均完成度: <strong className="text-brand-red block text-2xs font-black mt-0.5">{plan.completionRate}%</strong></div>
                      <div className="border-r border-gray-100">全班测验平均分: <strong className="text-brand-darkred block text-2xs font-black mt-0.5">{plan.averageScore || 75} 分</strong></div>
                      <div>已锁定参与学生数: <strong className="text-brand-gold block text-2xs font-black mt-0.5">{plan.studentCount} 人已接入</strong></div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-3xs">
                    <p className="text-gray-400 font-medium">AI 补盲干预规则：{plan.remediationRules.slice(0, 42)}...</p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDuplicatePlan(plan.id)}
                        className="px-3 py-1.5 border border-brand-borderred/30 hover:bg-brand-lightred/10 text-brand-red rounded text-3xs font-black cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> 复制学习计划
                      </button>
                      <button 
                        onClick={() => { setActivePlanFilter(plan.id); setView('A6'); }}
                        className="px-3.5 py-1.5 bg-brand-red hover:bg-[#590000] text-white rounded text-3xs font-black cursor-pointer shadow-xs transition-colors"
                      >
                        查看学情诊断看板
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* A6 (Class Monitor / Dashboard View) */}
      {currentView === 'A6' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-brand-borderred/20 pb-3">
            <div>
              <h3 className="text-xs font-black text-brand-darkred flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-brand-red" />
                医学统考大纲计划学情全量看板
              </h3>
              <p className="text-3xs text-gray-500 mt-0.5 font-semibold">多维筛选学生答题明细、跟踪多维补盲成效、教研勘误审核学生反馈</p>
            </div>

            <div className="flex gap-2">
              <select 
                value={activePlanFilter}
                onChange={(e) => setActivePlanFilter(e.target.value)}
                className="text-2xs bg-white border border-gray-300 rounded-md px-3 py-2 font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-red"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name.slice(0, 18)}...</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-tabs inside S9 */}
          <div className="flex gap-2.5 border-b border-gray-100 pb-2.5">
            <button
              onClick={() => setMonitorTab('progress')}
              className={`text-2xs font-black px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                monitorTab === 'progress' 
                  ? 'bg-brand-red text-white border-brand-red shadow-xs' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              试点学生大纲执行进度与学情诊断 ({classProgress.length} 人)
            </button>
            <button
              onClick={() => setMonitorTab('feedbacks')}
              className={`text-2xs font-black px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                monitorTab === 'feedbacks' 
                  ? 'bg-brand-red text-white border-brand-red shadow-xs' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              学生题目反馈及勘误待审 ({feedbacks.filter(f => f.status === 'pending').length} 条)
            </button>
          </div>

          {monitorTab === 'progress' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-3xs text-gray-500 bg-gradient-to-r from-gray-50 to-brand-lightred/5 p-4 rounded-lg border border-brand-borderred/10">
                <div>考纲通过基准: <strong className="text-brand-red block text-sm font-black mt-0.5">80分合格</strong></div>
                <div>大纲测试完成学生: <strong className="text-gray-700 block text-sm font-black mt-0.5">3 人已交卷</strong></div>
                <div>已完成补盲学生: <strong className="text-emerald-700 block text-sm font-black mt-0.5">1 人 (李建国)</strong></div>
                <div>进行中补盲加练: <strong className="text-brand-red block text-sm font-black mt-0.5">2 人</strong></div>
              </div>

              {/* Class roster monitor table */}
              <div className="overflow-x-auto border border-brand-borderred/15 rounded-lg bg-white shadow-3xs">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead>
                    <tr className="bg-brand-red text-white font-bold text-3xs">
                      <th className="p-3.5 pl-4">学生姓名</th>
                      <th className="p-3.5">考纲进度百分比</th>
                      <th className="p-3.5">基础题库正确率</th>
                      <th className="p-3.5">模拟测验最终得分</th>
                      <th className="p-3.5">薄弱考点诊断</th>
                      <th className="p-3.5">匹配补盲状态</th>
                      <th className="p-3.5 pr-4 text-right">学情诊断操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classProgress.map(row => (
                      <tr key={row.studentId} className="hover:bg-brand-lightred/5 transition-colors">
                        <td 
                          className="p-3.5 pl-4 font-black text-brand-red hover:text-brand-darkred hover:underline cursor-pointer"
                          onClick={() => setSelectedStudentDrawerId(row.studentId)}
                        >
                          {row.name}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-brand-red h-1.5 rounded-full" style={{ width: `${row.progress}%` }} />
                            </div>
                            <span className="font-mono font-bold text-gray-700">{row.progress}%</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono font-black text-brand-darkred">{row.avgCorrectRate}%</td>
                        <td className="p-3.5 font-black text-gray-800">{row.testScore ? `${row.testScore} 分` : '未考测'}</td>
                        <td className="p-3.5 truncate max-w-[160px] text-gray-500 font-semibold" title={row.weakPoints.join(', ')}>
                          {row.weakPoints.length > 0 ? row.weakPoints.join(', ') : '暂无薄弱考点 (全大纲通关) ✓'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded font-black text-3xs border ${
                            row.remediationStatus === '已完成' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            row.remediationStatus === '加练中' ? 'bg-brand-lightred/20 text-brand-red border-brand-borderred/20 font-black' :
                            row.remediationStatus === '已生成未开始' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                            'bg-gray-50 text-gray-400 border-gray-100'
                          }`}>
                            {row.remediationStatus}
                          </span>
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button 
                              onClick={() => setSelectedStudentDrawerId(row.studentId)}
                              className="px-2.5 py-1 border border-brand-borderred/30 hover:bg-brand-lightred/10 text-brand-red rounded text-3xs font-black cursor-pointer transition-colors"
                            >
                              诊断画像
                            </button>
                            {row.remediationStatus === '已生成未开始' && (
                              <button 
                                onClick={() => handleSendReminder(row.name)}
                                className="px-2.5 py-1 bg-brand-gold hover:bg-[#ab851a] text-white rounded text-3xs font-black cursor-pointer flex items-center gap-0.5 shadow-2xs"
                              >
                                <Mail className="w-2.5 h-2.5" /> 提醒
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {monitorTab === 'feedbacks' && (
            <div className="space-y-4">
              <p className="text-3xs text-gray-500 font-medium">以下为学生在练习作答、错题解析或微课学习中提交的题目纠错处理单：</p>
              
              <div className="space-y-4.5">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="border border-brand-borderred/15 bg-white rounded-lg p-4.5 space-y-3.5 text-2xs relative shadow-3xs overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-red" />
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-semibold">反馈学生：<strong>{fb.studentName}</strong></span>
                      <span className={`px-2 py-0.5 rounded font-bold text-3xs border ${
                        fb.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {fb.status === 'accepted' ? '已采纳' : '待审核'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-gray-400 font-mono text-3xs uppercase tracking-wider">题目编号 ID：{fb.questionId}</p>
                      <div className="text-brand-darkred bg-brand-lightred/5 p-3 rounded-lg border border-brand-borderred/10 italic font-medium">
                        “{fb.questionStem.slice(0, 80)}...”
                      </div>
                      <p className="text-gray-800 font-bold pt-1"><strong>具体建议描述：</strong>{fb.content}</p>
                    </div>

                    {fb.status === 'accepted' ? (
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 space-y-1 animate-fade-in font-medium">
                        <p className="font-black flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> 已采纳，已更新至统考大纲解析公告：</p>
                        <p className="text-3xs leading-relaxed">{fb.reply}</p>
                      </div>
                    ) : (
                      <div className="pt-3.5 border-t border-gray-100 space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-3xs font-extrabold text-gray-400 uppercase tracking-wider">拟采纳回复并更新大纲考点说明（对外发布）</label>
                          <textarea 
                            rows={2}
                            value={activeFeedbackId === fb.id ? feedbackReplyContent : ''}
                            onChange={(e) => {
                              setActiveFeedbackId(fb.id);
                              setFeedbackReplyContent(e.target.value);
                            }}
                            placeholder="如：教研组已核实。选项 D 错别字已修订，第 9 版生理学大纲考点解析描述已更新同步..."
                            className="w-full text-xs bg-gray-50 border border-gray-300 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => {
                              setFeedbacks(prev => prev.map(f => f.id === fb.id ? { ...f, status: 'rejected' } : f));
                              alert('已搁置暂不采纳此反馈意见。');
                            }}
                            className="px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded text-3xs font-black cursor-pointer"
                          >
                            暂搁置
                          </button>
                          <button 
                            onClick={() => handleResolveFeedback(fb.id)}
                            className="px-4 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-3xs font-black shadow-xs cursor-pointer transition-colors"
                          >
                            一键审核通过，并更新全网解析公告
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Diagnostic Profile Drawer Overlay (Right Side) */}
          {selectedStudentDrawerId && (() => {
            const row = classProgress.find(x => x.studentId === selectedStudentDrawerId);
            if (!row) return null;

            return (
              <div className="fixed inset-0 bg-black/50 flex justify-end z-50 animate-fade-in">
                <div className="bg-white max-w-md w-full h-full p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between border-l border-brand-borderred/20 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-red" />
                  
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="font-black text-xs text-brand-darkred flex items-center gap-1">
                          📊 试点学生学情诊断画像大屏
                        </h3>
                        <p className="text-3xs text-brand-gold font-bold uppercase tracking-wider">大纲通关系统</p>
                      </div>
                      <button 
                        onClick={() => setSelectedStudentDrawerId(null)}
                        className="p-1.5 hover:bg-brand-lightred/10 rounded text-brand-red font-black cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Basic info */}
                    <div className="bg-gradient-to-br from-gray-50 to-brand-lightred/5 border border-brand-borderred/20 p-4.5 rounded-lg space-y-2.5 text-2xs font-semibold">
                      <p className="text-brand-darkred font-black">学生姓名：<strong className="text-brand-red font-black text-xs">{row.name}</strong></p>
                      <p>教学身份阶段：{row.stage}</p>
                      <p>当前运作计划：临床医学通关计划</p>
                      <p className="text-gray-400">最近活跃登录时间：{row.lastActive}</p>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-2.5">
                      <h4 className="text-2xs font-bold text-brand-darkred">大纲考测与正确率表现：</h4>
                      <div className="grid grid-cols-2 gap-4 text-center text-2xs">
                        <div className="p-3.5 border border-brand-borderred/10 rounded-lg bg-white shadow-2xs">
                          <p className="text-gray-400 font-semibold">核心基础正确率</p>
                          <p className="font-mono font-black text-brand-red text-base mt-0.5">{row.avgCorrectRate}%</p>
                        </div>
                        <div className="p-3.5 border border-brand-borderred/10 rounded-lg bg-white shadow-2xs">
                          <p className="text-gray-400 font-semibold">近期大纲测测得分</p>
                          <p className="font-mono font-black text-brand-darkred text-base mt-0.5">{row.testScore ? `${row.testScore} 分` : '暂未考测'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Remediation status drill-down */}
                    <div className="p-4 bg-brand-lightred/10 border border-brand-borderred/20 rounded-lg text-2xs space-y-2 font-semibold">
                      <p className="font-bold text-brand-darkred flex items-center gap-1.5">定向补盲加练状态：</p>
                      <p className="text-gray-600">关联薄弱考点：<span className="text-brand-red font-black">{row.weakPoints.length > 0 ? row.weakPoints.join(', ') : '药理学 - 糖皮质激素抗炎机制'}</span></p>
                      <p className="text-gray-600">补盲进度：<span className="text-brand-gold font-bold">{row.remediationStatus}</span></p>
                      {row.remediationImprovement && (
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded text-emerald-800 text-3xs font-bold animate-fade-in">
                          提升幅度：正确率提升了 ＋{row.remediationImprovement}%！
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-100 pt-4 flex gap-2">
                    <button 
                      onClick={() => {
                        handleSendReminder(row.name);
                        setSelectedStudentDrawerId(null);
                      }}
                      className="flex-1 py-2.5 bg-brand-red hover:bg-brand-darkred text-white text-3xs font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5" /> 模拟推送微信/企业号催促
                    </button>
                    <button 
                      onClick={() => setSelectedStudentDrawerId(null)}
                      className="flex-1 py-2.5 border border-brand-borderred/30 hover:bg-brand-lightred/10 text-brand-red text-3xs font-black rounded-lg cursor-pointer transition-colors"
                    >
                      关闭诊断画像
                    </button>
                  </div>

                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
