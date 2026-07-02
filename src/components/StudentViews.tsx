import React, { useState } from 'react';
import { 
  StudentProfile, 
  StudyPlan, 
  Question, 
  TestAttempt, 
  RemediationPacket, 
  UserStage,
  PlanPhase
} from '../types';
import { 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Clock, 
  FileText, 
  Award, 
  RefreshCw, 
  ArrowLeft, 
  Send,
  Sparkles,
  Bookmark,
  TrendingUp,
  XCircle,
  HelpCircle,
  Calendar,
  BarChart2,
  PieChart
} from 'lucide-react';

interface StudentViewsProps {
  currentView: string;
  setView: (view: string) => void;
  student: StudentProfile;
  setStudent: React.Dispatch<React.SetStateAction<StudentProfile>>;
  plans: StudyPlan[];
  setPlans: React.Dispatch<React.SetStateAction<StudyPlan[]>>;
  questions: Question[];
  testAttempts: TestAttempt[];
  setTestAttempts: React.Dispatch<React.SetStateAction<TestAttempt[]>>;
  remediationPackets: RemediationPacket[];
  setRemediationPackets: React.Dispatch<React.SetStateAction<RemediationPacket[]>>;
  activePlanId: string | null;
  setActivePlanId: (id: string | null) => void;
  activePhaseId: string | null;
  setActivePhaseId: (id: string | null) => void;
  onAddFeedback: (qId: string, qStem: string, type: string, content: string) => void;
}

export const StudentViews: React.FC<StudentViewsProps> = ({
  currentView,
  setView,
  student,
  setStudent,
  plans,
  setPlans,
  questions,
  testAttempts,
  setTestAttempts,
  remediationPackets,
  setRemediationPackets,
  activePlanId,
  setActivePlanId,
  activePhaseId,
  setActivePhaseId,
  onAddFeedback
}) => {
  // S3 (Quiz) Local State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [isExamMode, setIsExamMode] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [selectedPracticeAnswer, setSelectedPracticeAnswer] = useState<string | null>(null);
  const [isPracticeAnswerChecked, setIsPracticeAnswerChecked] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'答案错漏' | '解析模糊' | '资源失效' | '难度不符'>('解析模糊');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // S3 Flagged Uncertain Questions State
  const [uncertainQuestions, setUncertainQuestions] = useState<{ [qId: string]: boolean }>({});

  // S4 (Remediation) Local State
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [remediationTab, setRemediationTab] = useState<'解析' | '补盲' | '复习记录'>('解析');
  const [errorSubjectFilter, setErrorSubjectFilter] = useState<string>('all');
  const [errorDifficultyFilter, setErrorDifficultyFilter] = useState<string>('all');
  const [errorSearchQuery, setErrorSearchQuery] = useState<string>('');

  // S5 (Report) View State
  const [reportTab, setReportTab] = useState<'current' | 'plan'>('current');

  // S1 (Student Home) & S6 (My Plans) Local Filters
  const [myPlanFilter, setMyPlanFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

  // In-app Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const activePlan = plans.find(p => p.id === activePlanId);
  const activePhase = activePlan?.phases.find(ph => ph.id === activePhaseId);

  // S1 Handler: Join Plan
  const handleJoinPlan = (planId: string) => {
    if (!student.joinedPlanIds.includes(planId)) {
      setStudent(prev => ({
        ...prev,
        joinedPlanIds: [...prev.joinedPlanIds, planId]
      }));
      setPlans(prev => prev.map(p => {
        if (p.id === planId) {
          return { ...p, studentCount: p.studentCount + 1 };
        }
        return p;
      }));
      const joinedPlan = plans.find(p => p.id === planId);
      showToast(`您已成功激活并加入大纲计划 《${joinedPlan?.name || '新复习大纲'}》！`, 'success');
    }
    setActivePlanId(planId);
    setView('S2');
  };

  // S1 Handler: Change Stage
  const handleStageChange = (stage: UserStage) => {
    let examGoal = '执业医师资格考试';
    if (stage === '医学研究生') examGoal = '医学研究生入学考试';
    if (stage === '住培医师') examGoal = '住院医师规范化培训结业考试';
    
    setStudent(prev => ({
      ...prev,
      stage,
      examGoal
    }));
    showToast(`统考大纲及自测题库已精准切换至 “${stage}” 对应考纲！`, 'info');
  };

  // Get active test questions for Phase
  const getPhaseQuestions = () => {
    if (!activePhase) return [];
    // Just grab first few matching difficulty or random
    const count = activePhase.questionCount;
    return questions.slice(0, count);
  };

  // S3 Handler: Start Practice/Quiz
  const handleStartPhase = (planId: string, phaseId: string) => {
    setActivePlanId(planId);
    setActivePhaseId(phaseId);
    const plan = plans.find(p => p.id === planId);
    const phase = plan?.phases.find(ph => ph.id === phaseId);
    
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setExamSubmitted(false);
    setSelectedPracticeAnswer(null);
    setIsPracticeAnswerChecked(false);
    
    if (phase?.type === 'quiz') {
      setIsExamMode(true);
    } else {
      setIsExamMode(false);
    }
    setView('S3');
  };

  // S3 Handler: Start Remediation Packet Test
  const handleStartRemediationTest = (packet: RemediationPacket) => {
    setActivePlanId(packet.planId);
    setActivePhaseId('remediation_packet_' + packet.id);
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setExamSubmitted(false);
    setSelectedPracticeAnswer(null);
    setIsPracticeAnswerChecked(false);
    setIsExamMode(true); // Retests are like short quizzes
    setView('S3');
  };

  // S3 Handler: Submit Question (Practice Mode)
  const handlePracticeAnswerSelect = (optionChar: string) => {
    if (isPracticeAnswerChecked) return;
    setSelectedPracticeAnswer(optionChar);
    setIsPracticeAnswerChecked(true);
    setQuizAnswers(prev => ({
      ...prev,
      [getPhaseQuestions()[currentQuestionIndex].id]: optionChar
    }));
  };

  // S3 Handler: Choose Option (Exam Mode)
  const handleExamAnswerSelect = (qId: string, optionChar: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [qId]: optionChar
    }));
  };

  // S3 Handler: Submit Exam / Practice Phase
  const handleSubmitQuiz = () => {
    if (!activePlan || !activePhase) return;
    const phaseQuestions = getPhaseQuestions();
    
    let correctCount = 0;
    const answersMap = { ...quizAnswers };
    const weakPoints: string[] = [];

    phaseQuestions.forEach(q => {
      const studentAns = answersMap[q.id] || '';
      if (studentAns === q.answer) {
        correctCount++;
      } else {
        if (!weakPoints.includes(q.knowledgePoint)) {
          weakPoints.push(q.knowledgePoint);
        }
      }
    });

    const score = Math.round((correctCount / phaseQuestions.length) * 100);
    
    // Add attempt
    const newAttempt: TestAttempt = {
      id: 'att_' + Date.now(),
      studentId: student.id,
      planId: activePlan.id,
      type: activePhase.type,
      score,
      maxScore: 100,
      totalQuestions: phaseQuestions.length,
      correctCount,
      completedAt: new Date().toLocaleDateString(),
      weakPoints,
      answers: answersMap
    };

    setTestAttempts(prev => [newAttempt, ...prev]);

    // Check if remediation triggers (Score < 80 for quiz, or < 60 for practice)
    const threshold = activePhase.type === 'quiz' ? 80 : 60;
    if (score < threshold && weakPoints.length > 0) {
      // Create remediation packet
      const newPacket: RemediationPacket = {
        id: 'rem_' + Date.now(),
        studentId: student.id,
        planId: activePlan.id,
        status: 'not_started',
        generatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5),
        weakPoints,
        questions: questions.filter(q => weakPoints.includes(q.knowledgePoint)),
        answers: {}
      };
      setRemediationPackets(prev => [newPacket, ...prev]);
    }

    setExamSubmitted(true);
    setView('S5'); // Redirect to S5 Report
  };

  // S3 Handler: Submit Remediation Retest
  const handleSubmitRemediationTest = (packetId: string) => {
    const packet = remediationPackets.find(p => p.id === packetId);
    if (!packet) return;

    let correctCount = 0;
    packet.questions.forEach(q => {
      if (quizAnswers[q.id] === q.answer) {
        correctCount++;
      }
    });
    const retestScore = Math.round((correctCount / packet.questions.length) * 100);

    setRemediationPackets(prev => prev.map(p => {
      if (p.id === packetId) {
        return {
          ...p,
          status: 'retested' as const,
          retestScore,
          answers: quizAnswers
        };
      }
      return p;
    }));

    setView('S4'); // Go back to Remediation dashboard S4
  };

  // S3 Handler: Submit Question Feedback
  const handleFeedbackSubmit = () => {
    const q = isPhaseQuiz() ? questions.slice(0, 5)[currentQuestionIndex] : getPhaseQuestions()[currentQuestionIndex];
    if (!q) return;
    onAddFeedback(q.id, q.stem, feedbackType, feedbackContent);
    setFeedbackContent('');
    setShowFeedbackModal(false);
    showToast('📣 纠错反馈提交成功！该题已精准归档并推送至教务后台核实。', 'success');
  };

  const isPhaseQuiz = () => {
    return activePhaseId?.startsWith('remediation_packet_') || activePhase?.type === 'quiz';
  };

  // S4 Handlers
  const handleStartPacketStudy = (packetId: string) => {
    setRemediationPackets(prev => prev.map(p => {
      if (p.id === packetId) {
        return { ...p, status: 'studying' };
      }
      return p;
    }));
  };

  // S1 Filter plans
  const studentPlans = plans.filter(p => p.stage === student.stage);
  const myPlansList = plans.filter(p => student.joinedPlanIds.includes(p.id));

  return (
    <div className="p-0 w-full space-y-6 relative text-gray-800">
      {/* Absolute Toast alert overlay */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-[#1e0000] border-2 border-brand-gold text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-black animate-pulse max-w-md text-center">
          <Sparkles className="w-4 h-4 text-brand-gold fill-brand-gold shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
      {/* 1. Header Navigation Bar (Includes Profile) */}
      <div className="bg-white border border-brand-borderred/40 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        {/* Subtle decorative Peking Red border top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red" />
        
        <div className="flex items-center gap-3">
          <div className="text-4xl filter drop-shadow-sm">{student.avatar}</div>
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              {student.name}
              <span className="text-xs px-2 py-0.5 bg-brand-lightred text-brand-red rounded-full border border-brand-borderred/40 font-bold">
                {student.stage}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              当前大纲目标: <span className="text-brand-red font-semibold">{student.examGoal}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Stage Change for Demo */}
        <div className="flex items-center gap-2 self-stretch md:self-auto border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
          <span className="text-2xs font-bold text-brand-darkred flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            快速模拟身份：
          </span>
          <select 
            value={student.stage} 
            onChange={(e) => handleStageChange(e.target.value as UserStage)}
            className="text-xs bg-brand-lightred/30 border border-brand-borderred/50 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red text-brand-darkred font-medium cursor-pointer hover:bg-brand-lightred/50"
          >
            <option value="医科本科生">本科生 (执业医师考试)</option>
            <option value="医学研究生">研究生 (西医综合考研)</option>
            <option value="住培医师">住培医师 (结业规范考试)</option>
          </select>
        </div>
      </div>

      {/* 2. S1 (Student Home View - Fully fledged Workbench) */}
      {currentView === 'S1' && (
        <div className="space-y-6">
          {/* Main Workbench Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left Main column (SaaS style dashboard) */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* State-driven Enrollment Banner */}
              {myPlansList.length === 0 ? (
                <div className="bg-amber-50 border-l-4 border-brand-gold p-5 rounded-r-lg text-xs space-y-2 shadow-xs border-y border-r border-brand-gold/10">
                  <h4 className="font-extrabold text-[#805300] flex items-center gap-1.5 text-sm">
                    <AlertCircle className="w-5 h-5 text-brand-gold shrink-0 fill-brand-gold/10" />
                    学情预警：您尚未加入任何统考医学大纲计划
                  </h4>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    当前您的账号处于【未加入计划】状态。大纲精准匹配系统已在右侧为您筛选出最匹配的备考路径。加入后可即时解锁日常练习、临床模拟测验、以及 AI 错题智能补盲包，帮助您高效达标！
                  </p>
                  <div className="pt-1.5 flex gap-2">
                    <button 
                      onClick={() => {
                        const firstRec = studentPlans[0];
                        if (firstRec) {
                          handleJoinPlan(firstRec.id);
                        } else {
                          showToast('暂无推荐计划，请联系管理员配置大纲。', 'warning');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-brand-gold hover:bg-amber-600 text-[#3b0000] text-3xs font-black rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      💡 一键激活推荐计划
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-lg text-xs space-y-2 shadow-xs border-y border-r border-emerald-500/10">
                  <h4 className="font-extrabold text-emerald-800 flex items-center gap-1.5 text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    学情跟踪：您已顺利加入医学考纲实训
                  </h4>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    当前您的账号处于【已加入计划】状态。您已激活 <strong>{myPlansList.length}</strong> 项复习大纲，系统正在实时记录您的答题轨迹。AI 定向错题补盲包已根据您在临床练习中的薄弱点同步生成，请确保及时完成复测。
                  </p>
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setView('S6')}
                  className="bg-white border border-gray-200 p-5 rounded-xl cursor-pointer hover:border-brand-borderred hover:shadow-md transition-all relative overflow-hidden group shadow-xs"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-red group-hover:w-1.5 transition-all" />
                  <div className="flex items-center justify-between mb-2 pl-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">我的复习计划</span>
                    <BookOpen className="w-4.5 h-4.5 text-brand-red" />
                  </div>
                  <div className="text-2xl font-black text-brand-red pl-1">{myPlansList.length} <span className="text-xs font-semibold text-gray-400">个已加入</span></div>
                  <p className="text-3xs text-gray-400 mt-2 pl-1 flex items-center gap-1">点击查看大纲阶段详情 <ChevronRight className="w-3 h-3 text-brand-red" /></p>
                </div>

                <div 
                  onClick={() => setView('S4')}
                  className="bg-white border border-gray-200 p-5 rounded-xl cursor-pointer hover:border-brand-gold hover:shadow-md transition-all relative overflow-hidden group shadow-xs"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold group-hover:w-1.5 transition-all" />
                  <div className="flex items-center justify-between mb-2 pl-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">今日错题与补盲</span>
                    <AlertCircle className="w-4.5 h-4.5 text-brand-gold" />
                  </div>
                  <div className="text-2xl font-black text-brand-gold pl-1">
                    {remediationPackets.length > 0 ? remediationPackets.reduce((acc, p) => acc + p.weakPoints.length, 0) : 1}
                    <span className="text-xs font-semibold text-gray-400"> 个待补盲</span>
                  </div>
                  <p className="text-3xs text-gray-400 mt-2 pl-1 flex items-center gap-1">AI 相似题加练包已生成 <ChevronRight className="w-3 h-3 text-brand-gold" /></p>
                </div>

                <div 
                  onClick={() => {
                    if (testAttempts.length > 0) {
                      setReportTab('current');
                      setView('S5');
                    } else {
                      showToast('暂无测验报告，请先加入计划并完成首次自测练习！', 'warning');
                    }
                  }}
                  className="bg-white border border-gray-200 p-5 rounded-xl cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all relative overflow-hidden group shadow-xs"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-1.5 transition-all" />
                  <div className="flex items-center justify-between mb-2 pl-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">最近测验报告</span>
                    <Award className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 pl-1">
                    {testAttempts.length > 0 ? `${testAttempts[0].score}分` : '暂无'}
                  </div>
                  <p className="text-3xs text-gray-400 mt-2 pl-1 flex items-center gap-1">分析正确率与考点趋势 <ChevronRight className="w-3 h-3 text-emerald-500" /></p>
                </div>
              </div>

              {/* Today's Tasks & Workbench Entry */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-brand-gold fill-brand-gold" />
                    今日备考任务大盘（教研标准对齐）
                  </h4>
                  <span className="text-3xs text-gray-400 font-bold">每日 24:00 自动更新大纲</span>
                </div>
                
                {myPlansList.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-brand-darkred font-bold">您当前暂无进行中的备考大纲</p>
                    <p className="text-2xs text-gray-400 leading-relaxed max-w-md mx-auto">
                      未激活计划前无法开启阶段测试与 AI 错题智能补盲加练。请从右侧【可加入大纲计划】中选择适合您的医学统考大纲并点击加入。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myPlansList.slice(0, 1).map(plan => {
                      // Find first incomplete phase
                      const incompletePhase = plan.phases.find(phase => {
                        const finished = testAttempts.some(att => att.planId === plan.id && att.type === phase.type);
                        return !finished;
                      }) || plan.phases[plan.phases.length - 1];

                      return (
                        <div key={plan.id} className="bg-brand-lightred/30 border border-brand-borderred/10 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="px-2 py-0.5 text-3xs bg-brand-red text-white rounded font-bold">当前计划任务</span>
                              <h5 className="font-bold text-xs text-brand-darkred">{plan.name}</h5>
                            </div>
                            <p className="text-2xs text-gray-600">
                              下一学习章节：<span className="text-brand-red font-bold">{incompletePhase.name}</span> ({incompletePhase.questionCount}题 · {incompletePhase.difficulty}难度 · {incompletePhase.requirement})
                            </p>
                          </div>
                          <button 
                            onClick={() => handleStartPhase(plan.id, incompletePhase.id)}
                            className="self-start md:self-auto px-4 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          >
                            继续练习作答 <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Remediation Task Entry */}
                    {remediationPackets.some(p => p.status !== 'retested') ? (
                      <div className="bg-amber-50/50 border border-brand-gold/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 text-3xs bg-brand-gold/20 text-amber-800 rounded border border-brand-gold/30 font-bold">AI 定向错题补盲</span>
                            <h5 className="font-bold text-xs text-amber-900">薄弱知识考点相似题加练包已送达</h5>
                          </div>
                          <p className="text-2xs text-gray-600">
                            已检测到您在自测中出现的薄弱点：<strong className="text-brand-darkred">{remediationPackets.filter(p => p.status !== 'retested')[0].weakPoints.join('、')}</strong>。系统已备齐仿真题与精细微课。
                          </p>
                        </div>
                        <button 
                          onClick={() => setView('S4')}
                          className="self-start md:self-auto px-4 py-1.5 bg-brand-gold hover:bg-amber-600 text-[#3b0000] rounded text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                        >
                          前往补盲消错 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 text-3xs bg-emerald-100 text-emerald-800 rounded font-bold">AI 消盲通过</span>
                            <h5 className="font-bold text-xs text-emerald-900">暂无积压的薄弱考点，掌握率满格</h5>
                          </div>
                          <p className="text-2xs text-gray-600">
                            干得漂亮！您在大纲中所触发的历次错题已全部通过仿真题加练并消除完毕。
                          </p>
                        </div>
                        <button 
                          onClick={() => setView('S4')}
                          className="self-start md:self-auto px-4 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 rounded text-xs font-bold transition-all cursor-pointer"
                        >
                          查看历史复习仓
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Study plan categorization and recommendation) */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Enrollment Category Split */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                
                {/* 1. Enrolled/Assigned Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                    已分配/已激活的大纲计划 ({myPlansList.length})
                  </h4>
                  
                  {myPlansList.length === 0 ? (
                    <p className="text-2xs text-gray-400 font-medium py-1.5">暂无已激活的大纲。激活后，该计划将长期留档在“我的学习计划”中。</p>
                  ) : (
                    <div className="space-y-2">
                      {myPlansList.map(plan => (
                        <div 
                          key={plan.id}
                          onClick={() => { setActivePlanId(plan.id); setView('S2'); }}
                          className="p-3 bg-brand-lightred/10 hover:bg-brand-lightred/20 border border-brand-borderred/15 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <h5 className="text-2xs font-extrabold text-brand-darkred truncate">{plan.name}</h5>
                            <p className="text-[10px] text-gray-500 mt-1">涵盖大纲：{plan.syllabus.join('、')}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-brand-red shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Available / Recommended Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    推荐激活的国家统考大纲 ({studentPlans.filter(p => !student.joinedPlanIds.includes(p.id)).length})
                  </h4>
                  
                  <div className="space-y-3">
                    {studentPlans.map(plan => {
                      const isJoined = student.joinedPlanIds.includes(plan.id);
                      return (
                        <div 
                          key={plan.id} 
                          className={`p-4 border rounded-lg transition-all ${
                            isJoined 
                              ? 'bg-gray-50/50 border-gray-200' 
                              : 'bg-white border-gray-200 hover:border-brand-borderred hover:shadow-xs'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.2 text-[9px] bg-brand-lightred text-brand-red border border-brand-borderred/30 rounded font-bold">{plan.target}</span>
                              <span className="text-[10px] text-gray-400">时间: {plan.duration}</span>
                            </div>
                            <h5 
                              onClick={() => { setActivePlanId(plan.id); setView('S2'); }}
                              className="font-bold text-2xs text-gray-800 hover:text-brand-red cursor-pointer transition-colors"
                            >
                              {plan.name}
                            </h5>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 gap-2">
                            <button 
                              onClick={() => { setActivePlanId(plan.id); setView('S2'); }}
                              className="text-3xs text-brand-red font-black hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              查看大纲详情
                            </button>
                            {isJoined ? (
                              <span className="text-3xs text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded">已加入备考</span>
                            ) : (
                              <button 
                                onClick={() => handleJoinPlan(plan.id)}
                                className="px-2.5 py-1 bg-brand-red hover:bg-[#590000] text-white text-3xs font-black rounded transition-colors cursor-pointer"
                              >
                                激活并加入
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. S2 (Plan Detail View) */}
      {currentView === 'S2' && activePlan && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('S1')}
              className="p-1 hover:bg-brand-lightred rounded-full text-brand-red transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-brand-darkred">返回主页</span>
          </div>

          {/* Plan Header Card */}
          <div className="bg-white border border-brand-borderred/30 rounded-lg p-5 space-y-3 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-brand-red" />
            <div className="flex items-center gap-2 pl-2">
              <span className="px-2.5 py-0.5 bg-brand-lightred border border-brand-borderred/40 text-brand-red rounded-full text-2xs font-bold">{activePlan.target}</span>
              <span className="text-2xs text-gray-400">大纲匹配教务时间：{activePlan.createdAt}</span>
            </div>
            <h2 className="text-base font-black text-gray-900 pl-2">{activePlan.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100 text-2xs text-gray-500 pl-2">
              <div>
                <p className="text-gray-400 font-medium">计划周期</p>
                <p className="font-bold text-brand-darkred mt-0.5">{activePlan.duration}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">大纲范围</p>
                <p className="font-bold text-gray-700 mt-0.5">{activePlan.syllabus.join('、')}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">适用人群</p>
                <p className="font-bold text-gray-700 mt-0.5">{activePlan.stage}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">教研热度</p>
                <p className="font-bold text-brand-gold mt-0.5">{activePlan.studentCount} 人已参与</p>
              </div>
            </div>
          </div>

          {/* Prominent unjoined warning inside S2 */}
          {!student.joinedPlanIds.includes(activePlan.id) && (
            <div className="bg-amber-50 border-l-4 border-brand-gold p-4.5 rounded-r-lg text-2xs space-y-2 shadow-2xs border-y border-r border-brand-gold/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="font-black text-[#805300] flex items-center gap-1.5">
                  <AlertCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 fill-brand-gold/10" />
                  【教务提示：您尚未激活加入本考试大纲学习计划】
                </h4>
                <p className="text-gray-500 font-semibold leading-relaxed">
                  加入后系统将为您即时开启大纲通关进度、解锁日常练习和模拟测验、以及 AI 错题智能补盲包。
                </p>
              </div>
              <button
                onClick={() => handleJoinPlan(activePlan.id)}
                className="px-4 py-2 bg-brand-red hover:bg-[#590000] text-white rounded text-2xs font-black shadow-md flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" /> 立即激活加入
              </button>
            </div>
          )}

          {/* Remediation rule prompt */}
          <div className="p-4 bg-brand-lightred/40 border border-brand-borderred/40 rounded-lg text-2xs text-brand-darkred space-y-1">
            <p className="font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" /> 教务智能补盲与过关标准：</p>
            <p className="text-brand-darkred/90 leading-relaxed font-medium">{activePlan.remediationRules}</p>
          </div>

          {/* Phases timeline list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-darkred uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-brand-red" />
              计划执行阶段大纲路径 ({activePlan.phases.length}个阶段)
            </h4>
            
            <div className="space-y-3">
              {activePlan.phases.map((phase, index) => {
                const isJoined = student.joinedPlanIds.includes(activePlan.id);
                // Simple logic: phase 1 is open. Phase N is unlocked if Phase N-1 has an attempt
                let isLocked = !isJoined;
                if (index > 0 && isJoined) {
                  const prevPhase = activePlan.phases[index - 1];
                  const completedPrev = testAttempts.some(att => att.planId === activePlan.id && att.type === prevPhase.type);
                  isLocked = !completedPrev;
                }

                const attempt = testAttempts.find(att => att.planId === activePlan.id && att.type === phase.type);
                const isCompleted = !!attempt;

                return (
                  <div 
                    key={phase.id} 
                    className={`border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isCompleted ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' : 
                      isLocked ? 'bg-gray-50/60 border-gray-100 opacity-60' : 
                      'bg-white border-brand-borderred/40 hover:border-brand-red hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-2xs font-bold ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 
                          isLocked ? 'bg-gray-200 text-gray-400' : 
                          'bg-brand-red text-white'
                        }`}>
                          {index + 1}
                        </span>
                        <h5 className="font-bold text-xs text-gray-800">{phase.name}</h5>
                        {isCompleted && <span className="text-3xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-0.5 font-bold"><CheckCircle className="w-2.5 h-2.5" /> 已过关</span>}
                      </div>
                      <p className="text-2xs text-gray-500 pl-7 leading-relaxed font-medium">
                        练习题量：<span className="text-gray-700">{phase.questionCount}道</span> · 难度系数：<span className="text-brand-gold font-semibold">{phase.difficulty}</span> · 达标标准：<span className="text-brand-red font-semibold">{phase.requirement}</span>
                      </p>
                    </div>

                    <div className="pl-7 md:pl-0">
                      {isLocked ? (
                        <button className="px-3.5 py-1.5 bg-gray-50 text-gray-400 border border-gray-200 rounded text-xs font-bold cursor-not-allowed flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 尚未开启
                        </button>
                      ) : isCompleted ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setView('S5'); }} // View report S5
                            className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> 报告 ({attempt.score}分)
                          </button>
                          <button 
                            onClick={() => handleStartPhase(activePlan.id, phase.id)}
                            className="px-2.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded text-xs cursor-pointer"
                            title="重新做题"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStartPhase(activePlan.id, phase.id)}
                          className="px-4 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          {phase.type === 'practice' ? '开始日常阶段练习' : '进入教研模拟测验'} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. S3 (Quiz & Practice Answer Sheet View) */}
      {currentView === 'S3' && (
        <div className="space-y-6">
          {/* Header row */}
          <div className="bg-white border border-brand-borderred/30 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs relative">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('S2')}
                className="p-1 hover:bg-brand-lightred rounded-full text-brand-red transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-brand-red bg-brand-lightred px-2 py-0.5 rounded border border-brand-borderred/30">
                  {isExamMode ? '模拟测验模式 (考后统一批改)' : '日常练习模式 (即时对错解析)'}
                </span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">
                  {activePhaseId?.startsWith('remediation_packet_') ? '医学大纲错题专项智能复测' : activePhase?.name}
                </h3>
              </div>
            </div>

            {/* Mode Switcher inside interactive prototype */}
            <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200 text-3xs font-bold self-stretch sm:self-auto">
              <button
                onClick={() => {
                  setIsExamMode(true);
                  setQuizAnswers({});
                  setSelectedPracticeAnswer(null);
                  setIsPracticeAnswerChecked(false);
                }}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer ${isExamMode ? 'bg-brand-red text-white shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
              >
                测验模式
              </button>
              <button
                onClick={() => {
                  setIsExamMode(false);
                  setQuizAnswers({});
                  setSelectedPracticeAnswer(null);
                  setIsPracticeAnswerChecked(false);
                }}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer ${!isExamMode ? 'bg-brand-red text-white shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
              >
                练习模式
              </button>
            </div>
          </div>

          {/* Current Question Block */}
          {(() => {
            const list = activePhaseId?.startsWith('remediation_packet_') 
              ? remediationPackets.find(p => 'remediation_packet_' + p.id === activePhaseId)?.questions || []
              : getPhaseQuestions();
            const question = list[currentQuestionIndex];

            if (!question) {
              return (
                <div className="bg-white border border-brand-borderred/30 rounded-lg p-8 text-center space-y-3">
                  <p className="text-xs text-gray-500 font-medium">当前阶段暂无适配的医学考点试题。</p>
                  <button onClick={() => setView('S2')} className="px-4 py-2 bg-brand-red hover:bg-brand-darkred text-white text-xs font-bold rounded cursor-pointer transition-all">返回大纲</button>
                </div>
              );
            }

            const currentAns = quizAnswers[question.id] || '';
            const isAnswered = isExamMode ? !!currentAns : isPracticeAnswerChecked;

            return (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Question Area */}
                <div className="xl:col-span-9 space-y-6">
                  
                  {/* Question Card */}
                  <div className="bg-white border border-brand-borderred/30 rounded-lg p-6 space-y-5 shadow-xs relative">
                    <div className="flex items-center justify-between text-3xs text-gray-400 border-b border-gray-100 pb-2.5">
                      <span className="px-2 py-0.5 bg-brand-lightred text-brand-red rounded font-bold border border-brand-borderred/20">{question.category} · {question.type}型题</span>
                      <span className="font-medium text-brand-gold bg-amber-50 px-2 py-0.5 rounded border border-brand-gold/10">进度: {currentQuestionIndex + 1} / {list.length}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-3xs font-bold text-gray-400">【临床试题题干】</span>
                      <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                        {question.stem}
                      </p>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2.5">
                      {question.options.map((option, idx) => {
                        const optionChar = ['A', 'B', 'C', 'D'][idx];
                        let btnStyle = 'border-gray-200 hover:border-brand-borderred/40 hover:bg-brand-lightred/10 bg-white text-gray-800';
                        
                        if (isExamMode) {
                          if (currentAns === optionChar) {
                            btnStyle = 'border-brand-red bg-brand-lightred/50 text-brand-darkred font-bold ring-1 ring-brand-red';
                          }
                        } else {
                          // Practice Mode Colors immediately after submission
                          if (isPracticeAnswerChecked) {
                            if (optionChar === question.answer) {
                              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-500';
                            } else if (selectedPracticeAnswer === optionChar) {
                              btnStyle = 'border-rose-500 bg-rose-50 text-rose-800 font-bold';
                            }
                          } else if (selectedPracticeAnswer === optionChar) {
                            btnStyle = 'border-brand-red bg-brand-lightred text-brand-darkred font-bold ring-1 ring-brand-red';
                          }
                        }

                        return (
                          <button
                            key={optionChar}
                            onClick={() => {
                              if (isExamMode) handleExamAnswerSelect(question.id, optionChar);
                              else handlePracticeAnswerSelect(optionChar);
                            }}
                            className={`w-full text-left p-3.5 text-xs border rounded-lg transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                          >
                            <span className="flex items-center gap-3">
                              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 text-3xs font-extrabold border border-gray-200 shrink-0">
                                {optionChar}
                              </span>
                              <span className="font-medium">{option}</span>
                            </span>
                            
                            {!isExamMode && isPracticeAnswerChecked && optionChar === question.answer && (
                              <span className="text-3xs text-white bg-emerald-600 px-2 py-0.5 rounded font-extrabold shadow-2xs">标准答案</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Instant Feedback Panel (Practice Mode Only) */}
                  {!isExamMode && isPracticeAnswerChecked && (
                    <div className="bg-emerald-50/20 border border-emerald-200 rounded-lg p-5 space-y-4 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-3xs rounded font-bold ${
                            selectedPracticeAnswer === question.answer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {selectedPracticeAnswer === question.answer ? '回答正确 ✓' : '回答错误 ✗'}
                          </span>
                          <span className="text-2xs text-gray-600">
                            你的答案：<strong className={selectedPracticeAnswer === question.answer ? 'text-emerald-700' : 'text-rose-700'}>{selectedPracticeAnswer}</strong> · 
                            正确答案：<strong className="text-emerald-700">{question.answer}</strong>
                          </span>
                        </div>
                        
                        <span className="text-3xs text-brand-gold bg-amber-50 px-2 py-0.5 rounded border border-brand-gold/20 font-bold">考点: {question.knowledgePoint}</span>
                      </div>

                      <div className="space-y-1.5 text-2xs text-gray-700">
                        <p className="font-extrabold text-brand-darkred flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-brand-gold" />
                          【权威解析及补盲指南】
                        </p>
                        <p className="leading-relaxed bg-white/70 p-3 rounded border border-brand-borderred/10 font-medium whitespace-pre-line">{question.explanation}</p>
                      </div>
                    </div>
                  )}

                  {/* Error Cause Classification (Practice Mode Only, on mistake) */}
                  {!isExamMode && isPracticeAnswerChecked && selectedPracticeAnswer !== question.answer && (
                    <div className="bg-rose-50/50 p-3.5 rounded-lg border border-rose-200 space-y-2">
                      <p className="text-3xs font-extrabold text-rose-800 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                        教研核实：请自主选择此题回答错误的【错因归因】
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['审题不细', '概念模糊', '知识遗忘', '解题粗心'].map(cause => (
                          <button
                            key={cause}
                            onClick={() => showToast(`已将错因 【${cause}】 精准归档至该大纲考点的薄弱点分析仓！`, 'info')}
                            className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded text-3xs text-rose-700 font-extrabold cursor-pointer transition-colors"
                          >
                            {cause}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uncertain Bookmark & Draft Progress Bar */}
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 text-3xs text-gray-500 gap-3">
                    <button
                      onClick={() => {
                        const flagged = !uncertainQuestions[question.id];
                        setUncertainQuestions(prev => ({ ...prev, [question.id]: flagged }));
                        showToast(flagged ? '📌 已成功将此题标记为【不确定试题】，便于考后精准复习！' : '📌 已取消本题的不确定标记', 'info');
                      }}
                      className={`px-3 py-1.5 rounded border font-black flex items-center gap-1.5 transition-colors cursor-pointer text-3xs ${
                        uncertainQuestions[question.id]
                          ? 'bg-amber-100 border-brand-gold text-brand-gold font-bold ring-1 ring-brand-gold/30'
                          : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${uncertainQuestions[question.id] ? 'fill-brand-gold text-brand-gold' : 'text-gray-400'}`} />
                      {uncertainQuestions[question.id] ? '已标记不确定' : '标记为不确定'}
                    </button>

                    <button
                      onClick={() => {
                        showToast('💾 当前大纲作答进度已实时本地暂存，您可以随时安全退出或继续答题。', 'success');
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded font-black text-gray-700 flex items-center gap-1.5 cursor-pointer transition-colors text-3xs"
                    >
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      暂存作答草稿
                    </button>
                  </div>

                  {/* Question Action Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowFeedbackModal(true)}
                        className="px-3 py-1.5 border border-brand-borderred/30 hover:bg-brand-lightred/20 text-brand-red rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> 纠错反馈
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {currentQuestionIndex > 0 && (
                        <button 
                          onClick={() => {
                            setCurrentQuestionIndex(prev => prev - 1);
                            if (!isExamMode) {
                              // Recover practice mode selected answers for previous question if stored
                              const prevQ = list[currentQuestionIndex - 1];
                              const prevAns = quizAnswers[prevQ.id] || null;
                              setSelectedPracticeAnswer(prevAns);
                              setIsPracticeAnswerChecked(!!prevAns);
                            }
                          }}
                          className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-bold cursor-pointer"
                        >
                          上一题
                        </button>
                      )}

                      {currentQuestionIndex < list.length - 1 ? (
                        <button 
                          onClick={() => {
                            setCurrentQuestionIndex(prev => prev + 1);
                            if (!isExamMode) {
                              const nextQ = list[currentQuestionIndex + 1];
                              const nextAns = quizAnswers[nextQ.id] || null;
                              setSelectedPracticeAnswer(nextAns);
                              setIsPracticeAnswerChecked(!!nextAns);
                            }
                          }}
                          disabled={!isExamMode && !isPracticeAnswerChecked}
                          className={`px-4 py-1.5 rounded text-xs font-bold cursor-pointer transition-all ${
                            !isExamMode && !isPracticeAnswerChecked 
                              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                              : 'bg-brand-red hover:bg-brand-darkred text-white shadow-xs'
                          }`}
                        >
                          下一题
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (activePhaseId?.startsWith('remediation_packet_')) {
                              const pId = activePhaseId.replace('remediation_packet_', '');
                              handleSubmitRemediationTest(pId);
                            } else {
                              handleSubmitQuiz();
                            }
                          }}
                          disabled={!isExamMode && !isPracticeAnswerChecked}
                          className={`px-5 py-1.5 rounded text-xs font-extrabold cursor-pointer transition-all ${
                            !isExamMode && !isPracticeAnswerChecked 
                              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {isExamMode ? '交卷并生成诊断报告' : '完成该阶段日常练习'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Answer Card */}
                <div className="xl:col-span-3 space-y-4">
                  <div className="bg-white border border-brand-borderred/30 rounded-xl p-4.5 space-y-4 shadow-xs">
                    <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-brand-red" />
                        医学统考答题卡
                      </h4>
                      <span className="text-[10px] text-gray-400 font-bold">共 {list.length} 题</span>
                    </div>

                    {/* Status Legend */}
                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-medium border-b border-gray-50 pb-2.5">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600 block" />
                        <span>已答</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-white border border-gray-300 block" />
                        <span>未答</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-500 block" />
                        <span>不确定</span>
                      </div>
                    </div>

                    {/* Question Indices Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {list.map((q, idx) => {
                        const qAns = quizAnswers[q.id];
                        const hasAnswered = !!qAns;
                        const isMarkedUncertain = !!uncertainQuestions[q.id];
                        const isCurrent = idx === currentQuestionIndex;

                        let cardStyle = 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300';
                        
                        if (isMarkedUncertain) {
                          cardStyle = 'bg-amber-100 border-amber-400 text-amber-800 font-bold';
                        } else if (hasAnswered) {
                          cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                        }

                        if (isCurrent) {
                          cardStyle += ' ring-2 ring-brand-red ring-offset-1';
                        }

                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setCurrentQuestionIndex(idx);
                              if (!isExamMode) {
                                const ans = quizAnswers[q.id] || null;
                                setSelectedPracticeAnswer(ans);
                                setIsPracticeAnswerChecked(!!ans);
                              }
                            }}
                            className={`h-9 flex flex-col items-center justify-center text-xs border rounded-lg font-mono transition-all relative cursor-pointer ${cardStyle}`}
                          >
                            <span>{idx + 1}</span>
                            {isMarkedUncertain && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 border border-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mode Hint Block */}
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-500 leading-relaxed font-medium">
                      {isExamMode ? (
                        <p>⚠️ <strong>测验模式：</strong>作答时无法查看即时对错与解析。交卷后生成多维度阶段诊断报告。</p>
                      ) : (
                        <p>💡 <strong>日常练习模式：</strong>作答并点击选项后，会即时批改并展示考点解析与错因归类选项。</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* Feedback Modal Overlay */}
          {showFeedbackModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-5 max-w-md w-full border border-brand-borderred/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <h4 className="font-bold text-xs text-brand-darkred flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 text-brand-red" />
                    临床多维度纠错反馈 (教务直联)
                  </h4>
                  <button onClick={() => setShowFeedbackModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-2xs font-bold text-gray-500 mb-1">反馈类型</label>
                    <select 
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value as any)}
                      className="w-full text-xs bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
                    >
                      <option value="答案错漏">答案表述存在错漏/争议</option>
                      <option value="解析模糊">解析说明不通俗/不够准确</option>
                      <option value="资源失效">关联补盲多媒体资源失效</option>
                      <option value="难度不符">题目难度标注与实际体感不符</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-gray-500 mb-1">具体意见与依据 (支持引用教材页数)</label>
                    <textarea 
                      rows={3}
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="请详细描述该题目的争议点，或教材对应页码支撑..."
                      className="w-full text-xs bg-gray-50 border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                  <button 
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-3.5 py-1.5 border border-gray-200 text-gray-500 rounded text-2xs font-semibold cursor-pointer hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackContent.trim()}
                    className="px-4 py-1.5 bg-brand-red hover:bg-brand-darkred disabled:bg-gray-200 text-white rounded text-2xs font-bold transition-all cursor-pointer"
                  >
                    提交教务审核
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. S4 (Remediation & Analysis View) */}
      {currentView === 'S4' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h2 className="text-sm font-black text-brand-darkred flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-brand-gold fill-brand-gold animate-bounce" />
              错题分析与智能个性化补盲中心
            </h2>
            <button 
              onClick={() => setView('S1')}
              className="text-xs text-brand-red hover:text-brand-darkred font-bold flex items-center gap-0.5"
            >
              返回学生首页 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Remediation Packets Panel */}
          <div className="space-y-4 bg-gradient-to-br from-amber-50/30 to-brand-lightred/10 p-5 rounded-lg border border-brand-borderred/30">
            <div className="flex items-center gap-1.5 border-b border-brand-borderred/10 pb-2">
              <Sparkles className="w-4 h-4 text-brand-gold fill-brand-gold" />
              <h4 className="text-xs font-black text-brand-darkred">AI 专属薄弱知识点加练包 (教务同步)</h4>
            </div>

            {remediationPackets.length === 0 ? (
              <div className="border border-dashed border-brand-borderred/30 rounded-lg p-6 text-center text-gray-400 text-xs font-medium">
                暂无自动触发的补盲加练包。当你在计划测验中出现不及格或薄弱点较多时，系统将即时智能生成！
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {remediationPackets.map(packet => {
                  const plan = plans.find(p => p.id === packet.planId);
                  return (
                    <div key={packet.id} className="border border-brand-gold/40 bg-white rounded-lg p-4 space-y-3 shadow-2xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 left-0 h-0.5 bg-brand-gold" />
                      
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-3xs font-bold text-gray-400">大纲匹配生成时间：{packet.generatedAt}</span>
                        <span className={`px-2.5 py-0.5 rounded text-3xs font-extrabold ${
                          packet.status === 'retested' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          packet.status === 'studying' ? 'bg-brand-lightred text-brand-red border border-brand-borderred/30' :
                          'bg-amber-50 text-brand-gold border border-brand-gold/20'
                        }`}>
                          {packet.status === 'retested' ? `复测成功 (${packet.retestScore}分)` :
                           packet.status === 'studying' ? '知识补盲讲解中' : '待激活学习'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-xs text-brand-darkred">
                          专项攻克知识考点：<strong className="text-brand-red">{packet.weakPoints.join('、')}</strong>
                        </h5>
                        <p className="text-3xs text-gray-500">
                          触发来源计划：{plan?.name || '心肺系统大纲辅导'}
                        </p>
                      </div>

                      {/* Interactive 5-stage horizontal timeline for packet lifecycle */}
                      <div className="bg-gray-50/70 border border-gray-100 p-3 rounded-lg flex items-center justify-between gap-1 max-w-xl mx-auto my-3 text-[10px]">
                        {/* Stage 1: 已生成 */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black">✓</div>
                          <span className="text-[9px] font-bold text-emerald-800 mt-1">已生成</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-emerald-500 min-w-[10px]" />

                        {/* Stage 2: 未开始 */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                            packet.status === 'not_started' ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-500 text-white'
                          }`}>
                            {packet.status === 'not_started' ? '●' : '✓'}
                          </div>
                          <span className={`text-[9px] font-bold mt-1 ${packet.status === 'not_started' ? 'text-amber-700 font-extrabold' : 'text-emerald-800'}`}>未开始</span>
                        </div>
                        <div className={`flex-1 h-0.5 min-w-[10px] ${packet.status === 'not_started' ? 'bg-gray-200' : 'bg-emerald-500'}`} />

                        {/* Stage 3: 进行中 */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                            packet.status === 'not_started' ? 'bg-gray-200 text-gray-400' :
                            packet.status === 'studying' ? 'bg-brand-red text-white animate-pulse' : 'bg-emerald-500 text-white'
                          }`}>
                            {packet.status === 'not_started' ? '3' : packet.status === 'studying' ? '●' : '✓'}
                          </div>
                          <span className={`text-[9px] font-bold mt-1 ${
                            packet.status === 'not_started' ? 'text-gray-400' :
                            packet.status === 'studying' ? 'text-brand-red font-extrabold' : 'text-emerald-800'
                          }`}>进行中</span>
                        </div>
                        <div className={`flex-1 h-0.5 min-w-[10px] ${packet.status === 'retested' ? 'bg-emerald-500' : 'bg-gray-200'}`} />

                        {/* Stage 4: 已完成 */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                            packet.status === 'retested' ? 'bg-emerald-500 text-white' :
                            packet.status === 'studying' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {packet.status === 'retested' ? '✓' : packet.status === 'studying' ? '●' : '4'}
                          </div>
                          <span className={`text-[9px] font-bold mt-1 ${
                            packet.status === 'retested' ? 'text-emerald-800' :
                            packet.status === 'studying' ? 'text-amber-700 font-extrabold' : 'text-gray-400'
                          }`}>已完成</span>
                        </div>
                        <div className={`flex-1 h-0.5 min-w-[10px] ${packet.status === 'retested' ? 'bg-emerald-500' : 'bg-gray-200'}`} />

                        {/* Stage 5: 复测完成 */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                            packet.status === 'retested' ? 'bg-emerald-500 text-white font-black' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {packet.status === 'retested' ? '✓' : '5'}
                          </div>
                          <span className={`text-[9px] font-bold mt-1 ${packet.status === 'retested' ? 'text-emerald-800 font-extrabold' : 'text-gray-400'}`}>复测完成</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                        <span className="text-3xs text-gray-500 font-medium">包含系统适配：{packet.questions.length} 道仿真医学测试题</span>
                        
                        {packet.status === 'not_started' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleStartPacketStudy(packet.id)}
                              className="px-3 py-1.5 bg-brand-gold hover:bg-amber-600 text-[#3b0000] rounded text-xs font-bold transition-colors cursor-pointer"
                            >
                              激活并阅读名师概念精讲
                            </button>
                          </div>
                        )}

                        {packet.status === 'studying' && (
                          <button 
                            onClick={() => handleStartRemediationTest(packet)}
                            className="px-3.5 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            开始仿真复测加练 <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {packet.status === 'retested' && (
                          <span className="text-2xs text-emerald-700 font-extrabold flex items-center gap-0.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 复测已通过，此考点大纲已被彻底补盲！
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Errors List with Detailed Remedial Material Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-2">
              <h4 className="text-xs font-black text-brand-darkred flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brand-red" />
                历史大纲错题与多维复习仓 ({questions.slice(1, 6).length}条教研错题记录)
              </h4>
              
              {/* Reset Filters button */}
              {(errorSubjectFilter !== 'all' || errorDifficultyFilter !== 'all' || errorSearchQuery !== '') && (
                <button 
                  onClick={() => {
                    setErrorSubjectFilter('all');
                    setErrorDifficultyFilter('all');
                    setErrorSearchQuery('');
                  }}
                  className="text-3xs text-brand-red font-bold hover:underline cursor-pointer"
                >
                  ✕ 清除所有筛选
                </button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-gray-200 shadow-3xs text-xs">
              <div>
                <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-1">按医学科目筛选</label>
                <select
                  value={errorSubjectFilter}
                  onChange={(e) => setErrorSubjectFilter(e.target.value)}
                  className="w-full text-2xs bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium text-gray-700"
                >
                  <option value="all">🔍 全部科目</option>
                  <option value="病理学">病理学基础</option>
                  <option value="病理解剖学">病理解剖学</option>
                  <option value="生理学">生理学基础</option>
                  <option value="内科学">内科学诊疗</option>
                  <option value="药理学">临床药理学</option>
                </select>
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-1">按难度系数筛选</label>
                <select
                  value={errorDifficultyFilter}
                  onChange={(e) => setErrorDifficultyFilter(e.target.value)}
                  className="w-full text-2xs bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium text-gray-700"
                >
                  <option value="all">⚡️ 全部难度</option>
                  <option value="易">易 (基础概念)</option>
                  <option value="中">中 (临床综合)</option>
                  <option value="难">难 (重症疑难)</option>
                </select>
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-1">模糊搜索考点/题干</label>
                <input
                  type="text"
                  placeholder="输入题干关键字、核心考点..."
                  value={errorSearchQuery}
                  onChange={(e) => setErrorSearchQuery(e.target.value)}
                  className="w-full text-2xs bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium text-gray-700"
                />
              </div>
            </div>
            
            <div className="border border-brand-borderred/30 rounded-lg bg-white overflow-hidden shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 min-h-[320px]">
                
                {/* Left Side: Mistake list with active filters */}
                <div className="col-span-1 bg-gray-50/50 p-3 space-y-2.5 max-h-[420px] overflow-y-auto">
                  <div className="text-3xs font-extrabold text-brand-darkred uppercase px-1 pb-1 border-b border-gray-100 flex items-center justify-between">
                    <span>错题卡片</span>
                    <span className="text-gray-400 font-bold">已过滤 {
                      (() => {
                        const baseMistakes = questions.slice(1, 6);
                        const filtered = baseMistakes.filter(q => {
                          if (errorSubjectFilter !== 'all' && q.category !== errorSubjectFilter) return false;
                          if (errorDifficultyFilter !== 'all' && q.difficulty !== errorDifficultyFilter) return false;
                          if (errorSearchQuery.trim()) {
                            const qLower = errorSearchQuery.toLowerCase();
                            const matchStem = q.stem.toLowerCase().includes(qLower);
                            const matchKP = q.knowledgePoint.toLowerCase().includes(qLower);
                            if (!matchStem && !matchKP) return false;
                          }
                          return true;
                        });
                        return filtered.length;
                      })()
                    } / {questions.slice(1, 6).length} 题</span>
                  </div>
                  
                  {(() => {
                    const baseMistakes = questions.slice(1, 6);
                    const filtered = baseMistakes.filter(q => {
                      if (errorSubjectFilter !== 'all' && q.category !== errorSubjectFilter) return false;
                      if (errorDifficultyFilter !== 'all' && q.difficulty !== errorDifficultyFilter) return false;
                      if (errorSearchQuery.trim()) {
                        const qLower = errorSearchQuery.toLowerCase();
                        const matchStem = q.stem.toLowerCase().includes(qLower);
                        const matchKP = q.knowledgePoint.toLowerCase().includes(qLower);
                        if (!matchStem && !matchKP) return false;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-6 text-center text-gray-400 text-3xs font-medium">
                          没有匹配当前筛选条件的错题。
                        </div>
                      );
                    }

                    return filtered.map((q, idx) => {
                      const isSelected = selectedErrorId === q.id || (!selectedErrorId && idx === 0);
                      return (
                        <div 
                          key={q.id}
                          onClick={() => { setSelectedErrorId(q.id); setRemediationTab('解析'); }}
                          className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-brand-red bg-brand-lightred text-brand-darkred font-bold shadow-2xs' 
                              : 'border-gray-200 hover:border-brand-borderred hover:bg-white bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-3xs text-gray-400 mb-1.5">
                            <span className="font-semibold text-brand-red">{q.category} · {q.difficulty}</span>
                            <span className="text-red-600 bg-red-50 border border-red-100 px-1 py-0.2 rounded font-extrabold">累计错 {idx === 0 ? '2' : '1'} 次</span>
                          </div>
                          <p className="text-gray-800 line-clamp-2 leading-relaxed font-medium">{q.stem}</p>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Right Side: Remediation Panel tabs */}
                <div className="col-span-2 p-5 space-y-4">
                  {(() => {
                    const selectedQ = questions.find(q => q.id === (selectedErrorId || 'q2'));
                    if (!selectedQ) return <p className="text-xs text-gray-400 p-4 text-center">点击左侧错题，查看医学大纲权威解析、视频微课及复习时间轴。</p>;

                    return (
                      <div className="space-y-4">
                        {/* Tab header buttons */}
                        <div className="flex border-b border-gray-100 pb-2.5 gap-5">
                          {(['解析', '补盲', '复习记录'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setRemediationTab(tab)}
                              className={`text-xs font-black pb-1.5 relative transition-all cursor-pointer ${
                                remediationTab === tab 
                                  ? 'text-brand-red border-b-2 border-brand-red' 
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {tab === '解析' ? '🔬 权威教研解析' : tab === '补盲' ? '💡 考点微课补盲' : '📅 复习学情轴'}
                            </button>
                          ))}
                        </div>

                        {remediationTab === '解析' && (
                          <div className="space-y-3.5 text-xs">
                            <div>
                              <p className="font-extrabold text-brand-darkred">错误题目背景干：</p>
                              <p className="text-gray-700 leading-relaxed bg-brand-lightred/30 border border-brand-borderred/10 p-3 rounded mt-1 font-medium">{selectedQ.stem}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-3xs text-gray-500 border-y border-gray-100 py-2">
                              <p>标准备考答案：<span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{selectedQ.answer}</span></p>
                              <p>考察核心考点：<span className="text-brand-darkred font-bold bg-brand-lightred/50 px-1.5 py-0.5 rounded">{selectedQ.knowledgePoint}</span></p>
                            </div>
                            <div>
                              <p className="font-extrabold text-brand-darkred">权威大纲解析说明：</p>
                              <p className="text-gray-700 leading-relaxed bg-emerald-50/20 border border-emerald-100 p-3 rounded mt-1 font-medium whitespace-pre-line">{selectedQ.explanation}</p>
                            </div>
                          </div>
                        )}

                        {remediationTab === '补盲' && (
                          <div className="space-y-4 text-xs">
                            <div className="p-3 bg-brand-lightred/40 border border-brand-borderred/30 rounded space-y-1.5">
                              <h5 className="font-extrabold text-brand-darkred flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
                                核心病理/医学机理深度补盲：{selectedQ.knowledgePoint}
                              </h5>
                              <p className="text-3xs text-brand-darkred leading-relaxed font-medium">
                                【大纲备考划重点】此知识点在国家医学统考或结业考试中常作为典型混淆型案例出现。
                                其关键生理特征在于：肺纤维素性炎发生时，若病变较轻，渗出物可被完全溶解。但若患者肺组织受损严重或治疗不及时，可能引发肺肉质变等其他变型病理。
                                在临床做题时，请注意鉴别各种炎症状态的干酪样坏死等渗出液结构，以便迅速解题。
                              </p>
                            </div>

                            <div className="space-y-2">
                              <p className="font-extrabold text-brand-darkred">🎥 考点配套智能微课讲解：</p>
                              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between border border-gray-200">
                                <div className="space-y-1">
                                  <p className="font-bold text-xs text-gray-800">【微课】第九版教材考点精细讲解 —— {selectedQ.knowledgePoint}</p>
                                  <p className="text-3xs text-gray-400">主讲：北京大学医学部教研专家组 · 时长: 8分钟 · 100%匹配大纲</p>
                                </div>
                                <button 
                                  onClick={() => showToast('配套微课视频已成功加载，您可以开始沉浸式学习！', 'success')}
                                  className="px-3 py-1 bg-brand-red hover:bg-brand-darkred text-white text-3xs font-black rounded cursor-pointer"
                                >
                                  播放微课
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {remediationTab === '复习记录' && (
                          <div className="space-y-4 text-xs">
                            <p className="font-extrabold text-brand-darkred">📅 针对该知识点的大纲复习学情轨迹：</p>
                            <div className="space-y-3.5 relative pl-4 border-l border-brand-borderred/20">
                              <div className="relative">
                                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-brand-red" />
                                <p className="font-bold text-gray-800">首次做错：触发教研大纲漏洞预警</p>
                                <p className="text-3xs text-gray-400">2026-07-01 10:14 · 在《心肺系统大纲辅导阶段自测》中答错该考点</p>
                              </div>
                              <div className="relative">
                                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-brand-gold" />
                                <p className="font-bold text-[#805300]">自动生成补盲加练包：教务同步下发</p>
                                <p className="text-3xs text-gray-400">2026-07-01 10:15 · 系统已自动派发相似考点加练仿真题与视频微课</p>
                              </div>
                              <div className="relative">
                                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-gray-300" />
                                <p className="font-bold text-gray-400">进行中：待阅读微课讲解并进行仿真复测</p>
                                <p className="text-3xs text-gray-400">暂未开始复测 · 建议在 24 小时内攻克以巩固长期记忆</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive actions block */}
                        <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100 mt-2">
                          <span className="text-3xs text-gray-400 font-semibold">诊断学情：此考点属于【高频核心考点】，建议尽快安排复测！</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                showToast(`🎯 已调取匹配考点【${selectedQ.knowledgePoint}】的相似统考原题，特训加载中...`, 'success');
                              }}
                              className="px-3 py-1.5 bg-brand-lightred hover:bg-brand-lightred/80 border border-brand-borderred/20 text-brand-red text-3xs font-extrabold rounded cursor-pointer transition-colors"
                            >
                              做相似题
                            </button>
                            <button
                              onClick={() => {
                                showToast(`⚡ 已向该考点派发【针对性大纲加练强化卷】。`, 'success');
                              }}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-brand-gold/30 text-brand-gold text-3xs font-extrabold rounded cursor-pointer transition-colors"
                            >
                              专项加练
                            </button>
                            <button
                              onClick={() => {
                                showToast(`📋 正在进入教研测验模式，限时闭卷考查：${selectedQ.knowledgePoint}`, 'success');
                                setIsExamMode(true);
                                setQuizAnswers({});
                                setSelectedPracticeAnswer(null);
                                setIsPracticeAnswerChecked(false);
                                setView('S3');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-3xs font-extrabold rounded cursor-pointer transition-all shadow-3xs"
                            >
                              立即复测
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. S5 (Report View) */}
      {currentView === 'S5' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h2 className="text-sm font-black text-brand-darkred flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-brand-gold fill-brand-gold" />
              阶段大纲测试学情评估报告
            </h2>
            <button 
              onClick={() => setView('S2')}
              className="text-xs text-brand-red hover:text-brand-darkred font-bold flex items-center gap-0.5 cursor-pointer"
            >
              返回教学大纲详情 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* S5 Report Mode Selector */}
          <div className="flex gap-2 border-b border-gray-100 pb-2">
            <button
              onClick={() => setReportTab('current')}
              className={`text-2xs px-3.5 py-1.5 rounded-md border font-extrabold transition-all cursor-pointer ${
                reportTab === 'current' 
                  ? 'bg-brand-lightred text-brand-red border-brand-borderred/40 shadow-2xs font-black' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              本次自测报告
            </button>
            <button
              onClick={() => setReportTab('plan')}
              className={`text-2xs px-3.5 py-1.5 rounded-md border font-extrabold transition-all cursor-pointer ${
                reportTab === 'plan' 
                  ? 'bg-brand-lightred text-brand-red border-brand-borderred/40 shadow-2xs font-black' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              计划大纲学习报告 (全周期)
            </button>
          </div>

          {reportTab === 'current' ? (
            /* Current Test Assessment Report */
            (() => {
              const attempt = testAttempts[0] || {
                score: 80,
                correctCount: 4,
                totalQuestions: 5,
                weakPoints: ['药理学 - 糖皮质激素抗炎机制'],
                completedAt: '今日'
              };

              const passed = attempt.score >= 80;

              return (
                <div className="space-y-6 animate-fadeIn">
                  {/* Peking Red gradient backdrop card */}
                  <div className="bg-gradient-to-br from-brand-darkred to-[#4d0000] border-2 border-brand-gold/30 text-white rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 text-9xl font-serif select-none pointer-events-none text-brand-gold">
                      医
                    </div>
                    
                    <div className="space-y-3.5 text-center md:text-left z-10">
                      <span className="px-2.5 py-0.5 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded text-3xs font-extrabold uppercase tracking-widest">
                        医学大纲测试评估已生成
                      </span>
                      <h3 className="text-xs text-brand-lightred font-bold">
                        诊断报告时间：{attempt.completedAt} · 本次作答
                      </h3>
                      <p className="text-xs font-semibold text-white/90">
                        大纲考核达标门槛：80分 · 本次正确率：<span className="text-brand-gold font-extrabold">{attempt.score}%</span>（答对 {attempt.correctCount} / {attempt.totalQuestions} 题）
                      </p>
                    </div>

                    <div className="flex flex-col items-center bg-[#2e0000] p-4 rounded-lg border border-brand-gold/20 shrink-0 shadow-inner z-10">
                      <div className="text-5xl font-black text-brand-gold font-mono">{attempt.score}<span className="text-sm font-bold text-white/60 ml-0.5">分</span></div>
                      <span className={`text-3xs px-2.5 py-0.5 rounded mt-2.5 font-black border uppercase tracking-wider ${
                        passed ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30' : 'bg-rose-950/50 text-rose-400 border-rose-500/30'
                      }`}>
                        {passed ? '考核已达标 ✓' : '触发自动补盲 ✗'}
                      </span>
                    </div>
                  </div>

                  {/* Weakness breakdown */}
                  <div className="bg-white border border-brand-borderred/30 rounded-lg p-5 space-y-4 shadow-xs relative">
                    <h4 className="text-xs font-black text-brand-darkred border-b border-gray-100 pb-2.5">
                      大纲考点漏洞扫描
                    </h4>
                    
                    {attempt.weakPoints.length === 0 ? (
                      <p className="text-xs text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 p-4 border border-emerald-100 rounded-lg">
                        <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" /> 完美通过！本次测验所有考察的医学大纲知识考点已完全掌握。
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-3xs text-gray-500 font-bold">检测到以下重点知识考点出现错误，不符合大纲基准正确率门槛：</p>
                        
                        <div className="space-y-3">
                          {attempt.weakPoints.map(wp => (
                            <div key={wp} className="p-3.5 bg-brand-lightred/30 border-l-4 border-brand-red border-y border-r border-brand-borderred/20 rounded-r-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                              <div className="space-y-1">
                                <p className="font-extrabold text-brand-darkred flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red" /> {wp}
                                </p>
                                <p className="text-3xs text-gray-500 font-semibold">建议立即通过错题中心的“视频微课+名师精炼”辅导包进行专项攻克。</p>
                              </div>

                              <button 
                                onClick={() => { setSelectedErrorId('q4'); setView('S4'); }}
                                className="px-3 py-1.5 bg-white border border-brand-borderred/30 hover:bg-brand-lightred text-brand-red rounded text-3xs font-extrabold self-start md:self-auto transition-colors cursor-pointer shadow-2xs"
                              >
                                立即进行专项多维补盲
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI 补盲包一键跳转提示栏 */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-brand-gold/40 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-gold/10 rounded-full border border-brand-gold/20">
                        <Sparkles className="w-5 h-5 text-brand-gold fill-brand-gold" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-brand-darkred">教研同步：AI 已为你智能生成了 1 个考点深度补盲包！</h4>
                        <p className="text-3xs text-gray-500 font-medium">针对薄弱点【药理学 - 糖皮质激素抗炎机制】。内含 8分钟名师微课视频 及 5道相似仿真巩固题。</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedErrorId('q4'); 
                        setView('S4');
                        showToast('已为你一键跳转到关联补盲包，快来开始微课攻克吧！', 'success');
                      }}
                      className="px-4 py-1.5 bg-brand-red hover:bg-brand-darkred text-white text-xs font-black rounded cursor-pointer transition-all shrink-0 shadow-2xs"
                    >
                      一键跳转到补盲包
                    </button>
                  </div>

                  {/* 分数段对比 & 错因归类占比 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 分数段对比 */}
                    <div className="bg-white border border-brand-borderred/30 rounded-lg p-4 space-y-3.5 shadow-2xs">
                      <h4 className="text-xs font-black text-brand-darkred border-b border-gray-100 pb-2 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-brand-red" />
                        本班同学统考分数段对比
                      </h4>
                      <div className="space-y-2.5 pt-1 text-3xs text-gray-500 font-bold">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>优秀 (90分 - 100分)</span>
                            <span className="text-gray-700">12人 · 24%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '24%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>良好 (80分 - 89分) -- 你的位置</span>
                            <span className="text-brand-red">28人 · 56%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-brand-red h-full rounded-full" style={{ width: '56%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>及格 (60分 - 79分)</span>
                            <span className="text-gray-700">8.5人 · 17%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: '17%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>不及格 (60分以下)</span>
                            <span className="text-gray-700">1.5人 · 3%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-gray-300 h-full rounded-full" style={{ width: '3%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 错因归类占比 */}
                    <div className="bg-white border border-brand-borderred/30 rounded-lg p-4 space-y-3.5 shadow-2xs">
                      <h4 className="text-xs font-black text-brand-darkred border-b border-gray-100 pb-2 flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-brand-gold" />
                        你的错因归类全景画像 (根据作答归纳)
                      </h4>
                      <div className="space-y-2.5 pt-1 text-3xs text-gray-500 font-bold">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>审题不细 (病史条件遗漏或题眼错判)</span>
                            <span className="text-brand-red font-black">40%占比</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-brand-red h-full rounded-full" style={{ width: '40%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>概念模糊 (病理生理机制概念混淆)</span>
                            <span className="text-brand-gold font-black">30%占比</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-brand-gold h-full rounded-full" style={{ width: '30%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>解题粗心 (标准答案误点/极低级错误)</span>
                            <span className="text-gray-700">20%占比</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: '20%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>知识遗忘 (未复习到此知识板块)</span>
                            <span className="text-gray-700">10%占比</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-gray-400 h-full rounded-full" style={{ width: '10%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Chart Metrics */}
                  <div className="bg-white border border-brand-borderred/30 rounded-lg p-5 space-y-4 shadow-xs">
                    <h4 className="text-xs font-black text-brand-darkred">教务大纲雷达维度诊断</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-gray-50 rounded border border-gray-100">
                        <p className="text-3xs text-gray-400 font-bold uppercase">心血管系统</p>
                        <p className="text-xs font-extrabold text-gray-800 mt-1 font-mono">100%</p>
                        <span className="text-3xs text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-extrabold border border-emerald-100 mt-1.5 inline-block">掌握牢固</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-100">
                        <p className="text-3xs text-gray-400 font-bold uppercase">呼吸系统</p>
                        <p className="text-xs font-extrabold text-gray-800 mt-1 font-mono">100%</p>
                        <span className="text-3xs text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-extrabold border border-emerald-100 mt-1.5 inline-block">掌握牢固</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-100">
                        <p className="text-3xs text-gray-400 font-bold uppercase">病理学基础</p>
                        <p className="text-xs font-extrabold text-gray-800 mt-1 font-mono">80%</p>
                        <span className="text-3xs text-brand-red bg-brand-lightred px-1.5 py-0.2 rounded font-extrabold border border-brand-borderred/20 mt-1.5 inline-block">大纲通过</span>
                      </div>
                      <div className="p-3 bg-[#fffbf0] rounded border border-brand-gold/10">
                        <p className="text-3xs text-brand-gold font-bold uppercase">临床药理</p>
                        <p className="text-xs font-extrabold text-[#4d3300] mt-1 font-mono">40%</p>
                        <span className="text-3xs text-[#b30000] bg-rose-50 px-1.5 py-0.2 rounded font-extrabold border border-red-100 mt-1.5 inline-block">亟需补盲</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex gap-3 justify-end border-t border-gray-100 pt-4">
                    <button 
                      onClick={() => setView('S2')}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-bold cursor-pointer"
                    >
                      返回计划列表
                    </button>
                    <button 
                      onClick={() => setView('S4')}
                      className="px-4 py-2 bg-brand-red hover:bg-brand-darkred text-white rounded text-xs font-black shadow-xs cursor-pointer transition-colors"
                    >
                      前往错题与补盲中心
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            /* Plan Overall Study Report */
            <div className="bg-white border border-brand-borderred/30 rounded-lg p-5 space-y-6 shadow-xs relative animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h4 className="text-xs font-black text-brand-darkred">全周期大纲学习轨迹概览</h4>
                <span className="text-3xs text-brand-gold bg-amber-50 px-2.5 py-0.5 rounded border border-brand-gold/20 font-extrabold">大纲覆盖率 88%</span>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-brand-lightred/20 p-4 rounded-lg border border-brand-borderred/10 text-center space-y-1">
                  <p className="text-[10px] text-gray-400 font-extrabold">累计平均掌握率</p>
                  <p className="text-2xl font-black text-brand-red font-mono">82%</p>
                  <p className="text-[9px] text-emerald-700 font-bold flex items-center justify-center gap-0.5">超全国平均 12.4%</p>
                </div>
                <div className="bg-amber-50/40 p-4 rounded-lg border border-brand-gold/15 text-center space-y-1">
                  <p className="text-[10px] text-gray-400 font-extrabold">大纲覆盖量</p>
                  <p className="text-2xl font-black text-brand-gold font-mono">35 <span className="text-2xs font-bold text-gray-500">道</span></p>
                  <p className="text-[9px] text-gray-500">已自测涵盖 4 个章节</p>
                </div>
                <div className="bg-emerald-50/30 p-4 rounded-lg border border-emerald-100 text-center space-y-1">
                  <p className="text-[10px] text-gray-400 font-extrabold">错题定向消除率</p>
                  <p className="text-2xl font-black text-emerald-700 font-mono">100%</p>
                  <p className="text-[9px] text-emerald-600 font-extrabold">3 个重度漏洞已被彻底补盲</p>
                </div>
              </div>

              {/* Learning progress fluctuations timeline */}
              <div className="space-y-3.5">
                <h5 className="text-3xs text-gray-400 font-bold uppercase tracking-wider">【各个备考大纲阶段成绩趋势波动】</h5>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-2xs font-semibold text-gray-700">
                      <span>阶段一：临床诊断大纲自测 (日常日常阶段练习)</span>
                      <span className="text-brand-red font-bold font-mono">80分 (已达标)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-red h-full" style={{ width: '80%' }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-2xs font-semibold text-gray-700">
                      <span>阶段二：心肺呼吸考纲自测 (教研模拟测验)</span>
                      <span className="text-brand-gold font-bold font-mono">90分 (优秀)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-gold h-full" style={{ width: '90%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI intelligent remediation advice */}
              <div className="p-4 bg-brand-lightred/20 border border-brand-borderred/20 rounded-lg text-2xs space-y-1.5">
                <p className="font-extrabold text-brand-darkred flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold fill-brand-gold animate-pulse" />
                  AI 智能全周期大纲诊断建议 (教研同步)：
                </p>
                <p className="text-gray-600 font-semibold leading-relaxed">
                  基于您在本大纲计划内的多轮答卷足迹，您的「心血管系统」、「呼吸系统」章节掌握极佳，正确率均达标 100%。唯独「临床药理学」下「糖皮质激素的抗炎机制」因审题不细、概念模糊出现错误，已被系统智能生成专项加练包。请点击下方的错题补盲中心，查看您的专属补盲卡片与复测题。
                </p>
              </div>

              {/* Bottom Actions for Study Report */}
              <div className="flex gap-3 justify-end border-t border-gray-100 pt-4">
                <button 
                  onClick={() => setView('S2')}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-bold cursor-pointer"
                >
                  返回教学大纲
                </button>
                <button 
                  onClick={() => setView('S4')}
                  className="px-4 py-2 bg-brand-red hover:bg-brand-darkred text-white rounded text-xs font-black shadow-xs cursor-pointer transition-colors"
                >
                  前往错题与补盲中心
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. S6 (My Plans View) */}
      {currentView === 'S6' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h2 className="text-sm font-black text-brand-darkred flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-brand-red" />
              已加入国家统考医学计划归档
            </h2>
            <button 
              onClick={() => setView('S1')}
              className="text-xs text-brand-red hover:text-brand-darkred font-bold flex items-center gap-0.5 cursor-pointer"
            >
              继续当前大纲练习 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Tab Row */}
          <div className="flex gap-2 border-b border-gray-100 pb-2">
            {(['all', 'active', 'completed', 'overdue'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMyPlanFilter(tab)}
                className={`text-xs px-3.5 py-1.5 rounded-md border font-extrabold transition-all cursor-pointer ${
                  myPlanFilter === tab 
                    ? 'bg-brand-lightred text-brand-red border-brand-borderred/30 shadow-2xs' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab === 'all' ? '全部加入计划' : tab === 'active' ? '进行中' : tab === 'completed' ? '已通过完成' : '已逾期结课'}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          {(() => {
            const filteredPlans = myPlansList.filter(p => {
              if (myPlanFilter === 'active') return p.status === 'active';
              if (myPlanFilter === 'completed') return p.completionRate === 100;
              if (myPlanFilter === 'overdue') return p.status === 'ended';
              return true;
            });

            if (filteredPlans.length === 0) {
              return (
                <div className="border border-dashed border-brand-borderred/30 p-8 text-center text-gray-400 text-xs font-medium rounded-lg">
                  暂无匹配当前筛选的加入计划。
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredPlans.map(plan => {
                  const completedPhases = plan.phases.filter(phase => 
                    testAttempts.some(att => att.planId === plan.id && att.type === phase.type)
                  ).length;
                  const percent = Math.round((completedPhases / plan.phases.length) * 100);

                  return (
                    <div key={plan.id} className="border border-brand-borderred/20 rounded-lg p-4 bg-white hover:border-brand-borderred hover:shadow-xs transition-all space-y-3 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-red" />
                      
                      <div className="flex items-center justify-between text-3xs text-gray-400 pl-2">
                        <span className="font-semibold text-brand-red">{plan.target}</span>
                        <span className="font-medium text-brand-gold">周期：{plan.duration}</span>
                      </div>

                      <div className="space-y-2 pl-2">
                        <h4 className="font-extrabold text-xs text-gray-900 hover:text-brand-red cursor-pointer" onClick={() => { setActivePlanId(plan.id); setView('S2'); }}>
                          {plan.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-100 rounded-full h-2 max-w-[240px] overflow-hidden">
                            <div className="bg-brand-red h-2 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-3xs font-mono font-black text-brand-red">{percent}%</span>
                          <span className="text-3xs text-gray-400 font-bold">({completedPhases}/{plan.phases.length} 阶段解锁)</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 text-3xs pl-2">
                        <span className="text-gray-400 font-medium">涵盖科目大纲: {plan.syllabus.join('、')}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setActivePlanId(plan.id); setView('S2'); }}
                            className="px-3 py-1.5 border border-brand-borderred/30 hover:bg-brand-lightred/20 text-brand-red rounded text-3xs font-extrabold cursor-pointer transition-colors"
                          >
                            进度管理
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Historical Logs and records grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. 历史测验记录 */}
            <div className="border border-brand-borderred/30 rounded-lg p-4 bg-white space-y-3.5 shadow-2xs">
              <h4 className="text-xs font-black text-brand-darkred flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <BookOpen className="w-4 h-4 text-brand-red" />
                📝 历史考纲自测与模拟考
              </h4>
              
              {testAttempts.length === 0 ? (
                <p className="text-3xs text-gray-400 font-medium py-4 text-center">暂无自测或考试记录</p>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto pr-1">
                  {testAttempts.map(att => {
                    const plan = plans.find(p => p.id === att.planId);
                    return (
                      <div key={att.id} className="py-2.5 text-3xs space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <p className="font-extrabold text-gray-800 line-clamp-1">{plan?.name || '心肺系统自测'}</p>
                          <span className="font-black font-mono text-brand-red text-2xs shrink-0">{att.score}分</span>
                        </div>
                        <div className="flex justify-between text-4xs text-gray-400">
                          <span>{att.type === 'quiz' ? '综合模拟考' : '日常大纲自测'}</span>
                          <span>答对 {att.correctCount}/{att.totalQuestions} 题</span>
                        </div>
                        <p className="text-4xs text-gray-400 text-right font-medium">提交于: {att.completedAt}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. 历次评估学情报告 */}
            <div className="border border-brand-borderred/30 rounded-lg p-4 bg-white space-y-3.5 shadow-2xs">
              <h4 className="text-xs font-black text-brand-darkred flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Award className="w-4 h-4 text-brand-gold fill-brand-gold/20" />
                📊 历次考后多维评估报告
              </h4>
              
              {testAttempts.length === 0 ? (
                <p className="text-3xs text-gray-400 font-medium py-4 text-center">暂无诊断报告记录</p>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto pr-1">
                  {testAttempts.map((att, idx) => {
                    const plan = plans.find(p => p.id === att.planId);
                    return (
                      <div key={'rep-' + att.id} className="py-2.5 text-3xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <p className="font-extrabold text-gray-800 line-clamp-1">诊断报告 #{testAttempts.length - idx}</p>
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-extrabold text-4xs">教研已诊断</span>
                        </div>
                        <p className="text-4xs text-gray-500 line-clamp-1 font-medium">大纲关联：{plan?.name || '心肺系统计划'}</p>
                        <div className="flex justify-between items-center text-4xs text-gray-400">
                          <span>评估正确率：{Math.round((att.correctCount / att.totalQuestions) * 100)}%</span>
                          <button 
                            onClick={() => { setReportTab('current'); setView('S5'); }}
                            className="text-brand-red hover:underline font-bold cursor-pointer"
                          >
                            查看报告
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. 历史智能补盲包记录 */}
            <div className="border border-brand-borderred/30 rounded-lg p-4 bg-white space-y-3.5 shadow-2xs">
              <h4 className="text-xs font-black text-brand-darkred flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Sparkles className="w-4 h-4 text-brand-gold fill-brand-gold/20" />
                ⚡ 历史 AI 智能补盲包
              </h4>
              
              {remediationPackets.length === 0 ? (
                <p className="text-3xs text-gray-400 font-medium py-4 text-center">暂无生成补盲包记录</p>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto pr-1">
                  {remediationPackets.map((pkt) => {
                    const statusText = pkt.status === 'not_started' ? '未开始' 
                      : pkt.status === 'studying' ? '进行中' 
                      : pkt.status === 'retesting' ? '复测中' 
                      : pkt.status === 'completed' ? '已攻克' 
                      : '已消盲结课';
                    const statusColor = pkt.status === 'retested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : pkt.status === 'not_started' ? 'bg-amber-50 text-[#805300] border-amber-200'
                      : 'bg-brand-lightred text-brand-red border-brand-borderred/30';

                    return (
                      <div key={pkt.id} className="py-2.5 text-3xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <p className="font-extrabold text-gray-800 line-clamp-1">{pkt.planName}</p>
                          <span className={`px-1.5 py-0.2 rounded border font-extrabold text-4xs ${statusColor}`}>{statusText}</span>
                        </div>
                        <p className="text-4xs text-gray-500 font-semibold line-clamp-1">
                          薄弱考点：<strong className="text-brand-darkred font-extrabold">{pkt.weakPoints.join('、')}</strong>
                        </p>
                        <div className="flex justify-between items-center text-4xs text-gray-400">
                          <span>含 {pkt.questions.length} 道仿真复测题</span>
                          <button 
                            onClick={() => { setView('S4'); }}
                            className="text-brand-red hover:underline font-bold cursor-pointer"
                          >
                            前往补盲
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
