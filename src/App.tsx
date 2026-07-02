/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { StudentViews } from './components/StudentViews';
import { AdminViews } from './components/AdminViews';
import { 
  UserRole, 
  StudentProfile, 
  StudyPlan, 
  Question, 
  TestAttempt, 
  RemediationPacket, 
  ClassStudentProgress, 
  StudentFeedback 
} from './types';
import { 
  MOCK_QUESTIONS, 
  INITIAL_STUDENT_PROFILE, 
  INITIAL_STUDY_PLANS, 
  INITIAL_CLASS_PROGRESS, 
  INITIAL_FEEDBACKS,
  INITIAL_TEST_ATTEMPT
} from './mockData';
import { 
  Users, 
  BookOpen, 
  AlertCircle, 
  RefreshCw, 
  Layers,
  Home,
  CheckSquare,
  BarChart,
  Award,
  ClipboardList,
  PlusCircle,
  Send,
  TrendingUp,
  Sliders,
  Bell,
  Menu,
  FileText
} from 'lucide-react';

export default function App() {
  // Global Demo Role State
  const [role, setRole] = useState<UserRole>('student');
  
  // Shared Database State
  const [student, setStudent] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [plans, setPlans] = useState<StudyPlan[]>(INITIAL_STUDY_PLANS);
  const [classProgress, setClassProgress] = useState<ClassStudentProgress[]>(INITIAL_CLASS_PROGRESS);
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>(INITIAL_FEEDBACKS);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([INITIAL_TEST_ATTEMPT]);
  const [remediationPackets, setRemediationPackets] = useState<RemediationPacket[]>([]);

  // Navigation Routing States
  const [studentView, setStudentView] = useState<string>('S1'); // S1-S6
  const [adminView, setAdminView] = useState<string>('A1'); // A1-A6

  // Selected contexts for detailed views
  const [activePlanId, setActivePlanId] = useState<string | null>('plan_01');
  const [activePhaseId, setActivePhaseId] = useState<string | null>('p1');

  // Triggered when student submits error feedback on any question
  const handleAddFeedback = (
    qId: string, 
    qStem: string, 
    type: string, 
    content: string
  ) => {
    const newFb: StudentFeedback = {
      id: 'fb_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      questionId: qId,
      questionStem: qStem,
      feedbackType: type as any,
      content,
      status: 'pending'
    };
    setFeedbacks(prev => [newFb, ...prev]);
  };

  const currentView = role === 'student' ? studentView : adminView;
  const setView = (v: string) => {
    if (role === 'student') setStudentView(v);
    else setAdminView(v);
  };

  // Student Sidebar Navigation Links
  const studentNav = [
    { id: 'S1', label: '工作台首页', icon: Home },
    { id: 'S6', label: '我的学习计划', icon: BookOpen },
    { id: 'S4', label: '错题与消盲中心', icon: AlertCircle },
    { id: 'S5', label: '大纲诊断报告', icon: BarChart },
  ];

  // Admin Sidebar Navigation Links
  const adminNav = [
    { id: 'A1', label: '后台大盘概览', icon: Home },
    { id: 'A2', label: '学生范围管理', icon: Users },
    { id: 'A3', label: '统考大纲配置', icon: ClipboardList },
    { id: 'A4', label: '考试计划创建', icon: PlusCircle },
    { id: 'A5', label: '计划分拨发布', icon: Send },
    { id: 'A6', label: '全班学情看板', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      
      {/* 1. Brand Top Bar Header (SaaS Standard) */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-red flex items-center justify-center text-white shadow-md shadow-brand-red/10">
            <Layers className="w-5 h-5 text-brand-gold fill-brand-gold/10" />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5">
              <span>北医卫健 · 医学考纲智能精准实训系统</span>
              <span className="text-3xs px-1.5 py-0.5 bg-brand-lightred text-brand-red border border-brand-borderred/30 rounded font-black">
                大纲匹配 + AI智能消盲
              </span>
            </h1>
            <p className="text-4xs text-gray-400 font-semibold mt-0.5">
              北京大学医学教务处监制 · 医学统考大纲一体化练习与评测系统
            </p>
          </div>
        </div>

        {/* Header Right Interactions */}
        <div className="flex items-center gap-4">
          {/* Real-time sync notifier */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100 text-4xs font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>教务大纲数据实时连通 · 自适应补盲引擎就绪</span>
          </div>

          {/* Quick Info */}
          <div className="text-right hidden md:block">
            <p className="text-3xs font-extrabold text-gray-700">当前演示账号: {role === 'student' ? student.name : 'zhaoyue (教务管理员)'}</p>
            <p className="text-4xs text-gray-400 font-medium">阶段: {role === 'student' ? student.stage : '教研总监'}</p>
          </div>

          {/* Role Pill Switcher */}
          <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
            <button
              onClick={() => {
                setRole('student');
                setStudentView('S1');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-1 ${
                role === 'student'
                  ? 'bg-brand-red text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              学生端 (S1-S6)
            </button>
            <button
              onClick={() => {
                setRole('admin');
                setAdminView('A1');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-1 ${
                role === 'admin'
                  ? 'bg-[#8c0000] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              教管后台 (A1-A6)
            </button>
          </div>
        </div>
      </header>

      {/* 2. Platform Two-Column Workspace Layout */}
      <div className="flex flex-1 relative">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 sticky top-[69px] h-[calc(100vh-69px)] overflow-y-auto hidden md:flex">
          <div className="p-4 space-y-6">
            
            {/* User Profile Summary Panel inside Sidebar */}
            {role === 'student' ? (
              <div className="bg-brand-lightred/30 border border-brand-borderred/10 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="text-3xl">{student.avatar}</div>
                  <div>
                    <h4 className="text-xs font-black text-brand-darkred leading-none">{student.name}</h4>
                    <span className="text-[10px] text-brand-red font-bold mt-1 inline-block bg-white px-1.5 py-0.2 rounded border border-brand-borderred/20">{student.stage}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-brand-borderred/10 text-4xs text-gray-500 space-y-0.5">
                  <p>大纲目标: <strong className="text-brand-darkred">{student.examGoal}</strong></p>
                  <p>已参计划: <strong>{student.joinedPlanIds.length} 项已激活</strong></p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/60 border border-brand-gold/10 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold font-bold text-xs border border-brand-gold/20">🏫</div>
                  <div>
                    <h4 className="text-xs font-black text-[#5c3e00] leading-none">zhaoyue0704</h4>
                    <span className="text-[10px] text-amber-700 font-bold mt-1 inline-block bg-white px-1.5 py-0.2 rounded border border-brand-gold/20">教务系统总管理员</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-brand-gold/10 text-4xs text-gray-500 space-y-0.5">
                  <p>后台权属: <strong className="text-brand-darkred">全维度管控</strong></p>
                  <p>监控班级: <strong>医学临床/规培全体班</strong></p>
                </div>
              </div>
            )}

            {/* Nav Menu */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold tracking-wider px-3 uppercase block mb-2">
                {role === 'student' ? '核心学习终端' : '大纲教务管控后台'}
              </span>
              
              {(role === 'student' ? studentNav : adminNav).map(item => {
                const isActive = currentView === item.id || 
                  (item.id === 'S1' && (currentView === 'S2' || currentView === 'S3')); // S2/S3 highlight workbench
                const IconComp = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      isActive 
                        ? (role === 'student' 
                            ? 'bg-brand-red text-white shadow-sm shadow-brand-red/10' 
                            : 'bg-brand-darkred text-white shadow-sm shadow-brand-red/10')
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-gold' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-4xs text-gray-400 font-semibold space-y-1">
            <p>系统版本：v2.4.0-Stable</p>
            <p>AI大模型：Gemini 3.5 Flash</p>
            <p>© 2026 北京大学医学教务处</p>
          </div>
        </aside>

        {/* 3. Main Frame Viewport Content Area (Full-screen full width platform-style) */}
        <main className="flex-1 min-w-0 bg-slate-50/40 p-6 overflow-y-auto mb-14">
          <div className="max-w-full mx-auto">
            {role === 'student' ? (
              <StudentViews
                currentView={studentView}
                setView={setView}
                student={student}
                setStudent={setStudent}
                plans={plans}
                setPlans={setPlans}
                questions={MOCK_QUESTIONS}
                testAttempts={testAttempts}
                setTestAttempts={setTestAttempts}
                remediationPackets={remediationPackets}
                setRemediationPackets={setRemediationPackets}
                activePlanId={activePlanId}
                setActivePlanId={setActivePlanId}
                activePhaseId={activePhaseId}
                setActivePhaseId={setActivePhaseId}
                onAddFeedback={handleAddFeedback}
              />
            ) : (
              <AdminViews
                currentView={adminView}
                setView={setView}
                plans={plans}
                setPlans={setPlans}
                classProgress={classProgress}
                setClassProgress={setClassProgress}
                feedbacks={feedbacks}
                setFeedbacks={setFeedbacks}
                questions={MOCK_QUESTIONS}
              />
            )}
          </div>
        </main>
      </div>

      {/* 4. Bottom Sticky Toolbar (Now purely a clean debug reference, keeping it tiny and unobtrusive) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2.5 flex items-center justify-between z-40 text-4xs shadow-lg">
        <div className="flex items-center gap-1.5 text-gray-400 font-semibold">
          <span className="font-bold text-brand-darkred uppercase">📌 原型演示直达通道 (免做题直接测试各模块结构):</span>
        </div>

        {role === 'student' ? (
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'S1', label: 'S1 首页' },
              { id: 'S2', label: 'S2 详情' },
              { id: 'S3', label: 'S3 答题' },
              { id: 'S4', label: 'S4 错题补盲' },
              { id: 'S5', label: 'S5 诊断报告' },
              { id: 'S6', label: 'S6 我的计划' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStudentView(tab.id)}
                className={`px-2.5 py-1 rounded text-4xs font-black transition-colors border cursor-pointer ${
                  studentView === tab.id 
                    ? 'bg-brand-red border-brand-red text-white' 
                    : 'bg-brand-lightred/35 hover:bg-brand-lightred border-brand-borderred/20 text-brand-darkred'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'A1', label: 'A1 概览' },
              { id: 'A2', label: 'A2 学生管理' },
              { id: 'A3', label: 'A3 大纲标准' },
              { id: 'A4', label: 'A4 创建计划' },
              { id: 'A5', label: 'A5 计划总发布' },
              { id: 'A6', label: 'A6 学情看板' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminView(tab.id)}
                className={`px-2.5 py-1 rounded text-4xs font-black transition-colors border cursor-pointer ${
                  adminView === tab.id 
                    ? 'bg-brand-red border-brand-red text-white' 
                    : 'bg-brand-lightred/35 hover:bg-brand-lightred border-brand-borderred/20 text-brand-darkred'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </footer>

    </div>
  );
}

