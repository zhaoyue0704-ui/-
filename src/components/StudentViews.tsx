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
  Calendar
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

  // S4 (Remediation) Local State
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [remediationTab, setRemediationTab] = useState<'解析' | '补盲' | '复习记录'>('解析');

  // S1 (Student Home) & S6 (My Plans) Local Filters
  const [myPlanFilter, setMyPlanFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

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
    alert('题目反馈提交成功！管理员将尽快核实。');
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
    <div className="p-4 max-w-4xl mx-auto space-y-6">
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

      {/* 2. S1 (Student Home View) */}
      {currentView === 'S1' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setView('S6')}
              className="bg-white border border-gray-200 p-5 rounded-lg cursor-pointer hover:border-brand-borderred hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-red group-hover:w-1.5 transition-all" />
              <div className="flex items-center justify-between mb-2 pl-2">
                <span className="text-xs font-bold text-gray-500">我的学习计划</span>
                <BookOpen className="w-4 h-4 text-brand-red" />
              </div>
              <div className="text-2xl font-black text-brand-red pl-2">{myPlansList.length} <span className="text-xs font-normal text-gray-500">个已加入</span></div>
              <p className="text-2xs text-gray-400 mt-2 pl-2 flex items-center gap-1">点击查看全部计划历史 <ChevronRight className="w-3 h-3 text-brand-red" /></p>
            </div>

            <div 
              onClick={() => setView('S4')}
              className="bg-white border border-gray-200 p-5 rounded-lg cursor-pointer hover:border-brand-gold hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold group-hover:w-1.5 transition-all" />
              <div className="flex items-center justify-between mb-2 pl-2">
                <span className="text-xs font-bold text-gray-500">薄弱点与错题</span>
                <AlertCircle className="w-4 h-4 text-brand-gold" />
              </div>
              <div className="text-2xl font-black text-brand-gold pl-2">
                {remediationPackets.length > 0 ? remediationPackets.reduce((acc, p) => acc + p.weakPoints.length, 0) : 1}
                <span className="text-xs font-normal text-gray-500"> 个待补盲</span>
              </div>
              <p className="text-2xs text-gray-400 mt-2 pl-2 flex items-center gap-1">个性化加练包已生成 <ChevronRight className="w-3 h-3 text-brand-gold" /></p>
            </div>

            <div 
              onClick={() => {
                if (testAttempts.length > 0) setView('S5');
                else alert('暂无测验报告，请先加入计划参加测验。');
              }}
              className="bg-white border border-gray-200 p-5 rounded-lg cursor-pointer hover:border-brand-green hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-green group-hover:w-1.5 transition-all" />
              <div className="flex items-center justify-between mb-2 pl-2">
                <span className="text-xs font-bold text-gray-500">最新学情报告</span>
                <Award className="w-4 h-4 text-brand-green" />
              </div>
              <div className="text-2xl font-black text-brand-green pl-2">
                {testAttempts.length > 0 ? `${testAttempts[0].score}分` : '暂无'}
              </div>
              <p className="text-2xs text-gray-400 mt-2 pl-2 flex items-center gap-1">查看详细正确率与趋势 <ChevronRight className="w-3 h-3 text-brand-green" /></p>
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="bg-gradient-to-r from-brand-lightred/30 to-brand-lightred/50 border border-brand-borderred/30 rounded-lg p-5">
            <h4 className="text-xs font-bold text-brand-red uppercase tracking-wider mb-3 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-brand-gold fill-brand-gold" /> 今日任务建议 (教务标准对齐)
            </h4>
            
            {myPlansList.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-brand-darkred font-medium">您尚未加入任何适合该阶段的考试计划</p>
                <p className="text-2xs text-gray-500">大纲匹配系统已在下方为您筛选出最匹配的备考路径，请立即点击“加入计划”开启学习。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPlansList.slice(0, 1).map(plan => {
                  const latestAttempt = testAttempts.find(a => a.planId === plan.id);
                  // Find first incomplete phase
                  const incompletePhase = plan.phases.find(phase => {
                    const finished = testAttempts.some(att => att.planId === plan.id && att.type === phase.type);
                    return !finished;
                  }) || plan.phases[plan.phases.length - 1];

                  return (
                    <div key={plan.id} className="bg-white border border-brand-borderred/20 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 text-3xs bg-brand-lightred text-brand-red rounded border border-brand-borderred/30 font-bold">进行中计划</span>
                          <h5 className="font-bold text-xs text-gray-800">{plan.name}</h5>
                        </div>
                        <p className="text-2xs text-gray-500">
                          下一学习章节：<span className="text-brand-red font-semibold">{incompletePhase.name}</span> ({incompletePhase.questionCount}题 · {incompletePhase.difficulty}难度 · {incompletePhase.requirement})
                        </p>
                      </div>
                      <button 
                        onClick={() => handleStartPhase(plan.id, incompletePhase.id)}
                        className="self-start md:self-auto px-4 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                      >
                        继续学习 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Remediation Task */}
                {remediationPackets.some(p => p.status !== 'retested') && (
                  <div className="bg-amber-50/60 border border-brand-gold/30 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 text-3xs bg-brand-gold/10 text-brand-gold rounded border border-brand-gold/20 font-bold">今日 AI 补盲</span>
                        <h5 className="font-bold text-xs text-brand-orange">有待攻克的薄弱知识相似题加练包</h5>
                      </div>
                      <p className="text-2xs text-brand-darkred">
                        由于近考测中薄弱点增多，系统自动生成了：<strong className="font-bold">{remediationPackets.filter(p => p.status !== 'retested')[0].weakPoints.join(', ')}</strong> 的专属补盲包。
                      </p>
                    </div>
                    <button 
                      onClick={() => setView('S4')}
                      className="self-start md:self-auto px-4 py-1.5 bg-brand-gold hover:bg-amber-600 text-[#3b0000] rounded text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                    >
                      开始补盲复测 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assigned & Recommend Plans (S1 core) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-bold text-brand-darkred uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-brand-red" />
                适合我当前阶段的考试学习计划 ({studentPlans.length})
              </h4>
              <span className="text-3xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-semibold">基于“{student.stage}”匹配大纲</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {studentPlans.map(plan => {
                const isJoined = student.joinedPlanIds.includes(plan.id);
                return (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-borderred hover:shadow-sm transition-all relative overflow-hidden">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 text-3xs bg-brand-lightred text-brand-red rounded-full border border-brand-borderred/30 font-bold">{plan.target}</span>
                        <span className="text-3xs text-gray-400">学习周期：{plan.duration}</span>
                      </div>
                      <h5 className="font-bold text-sm text-gray-900 hover:text-brand-red cursor-pointer transition-colors" onClick={() => { setActivePlanId(plan.id); setView('S2'); }}>
                        {plan.name}
                      </h5>
                      <div className="flex items-center gap-3 text-2xs text-gray-500">
                        <span>涵盖科目大纲: <strong className="text-gray-700">{plan.syllabus.join(', ')}</strong></span>
                        <span>·</span>
                        <span>包含 {plan.phases.length} 个训练阶段</span>
                        <span>·</span>
                        <span>{plan.studentCount}人参与中</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setActivePlanId(plan.id); setView('S2'); }}
                        className="px-3.5 py-1.5 border border-brand-borderred/40 hover:bg-brand-lightred/20 text-brand-darkred rounded text-xs font-bold cursor-pointer"
                      >
                        详情大纲
                      </button>
                      {isJoined ? (
                        <button 
                          onClick={() => { setActivePlanId(plan.id); setView('S2'); }}
                          className="px-3.5 py-1.5 bg-gray-100 text-gray-400 border border-gray-200 rounded text-xs font-bold cursor-pointer"
                        >
                          已加入
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleJoinPlan(plan.id)}
                          className="px-3.5 py-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          加入计划
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
                          开始答题 <ChevronRight className="w-3.5 h-3.5" />
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
              <div className="space-y-6">
                {/* Question Area */}
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

                {/* Question Action Controls */}
                <div className="flex items-center justify-between">
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
          <div className="space-y-3">
            <h4 className="text-xs font-black text-brand-darkred flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-red" />
              历史大纲错题与多维复习仓 ({questions.slice(1, 4).length}条错题)
            </h4>
            
            <div className="border border-brand-borderred/30 rounded-lg bg-white overflow-hidden shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 min-h-[320px]">
                {/* Left Side: Mistake list */}
                <div className="col-span-1 bg-gray-50/50 p-3 space-y-2.5 max-h-[380px] overflow-y-auto">
                  <div className="text-3xs font-extrabold text-brand-darkred uppercase px-1 pb-1 border-b border-gray-100">错题卡片</div>
                  {questions.slice(1, 4).map((q, idx) => (
                    <div 
                      key={q.id}
                      onClick={() => { setSelectedErrorId(q.id); setRemediationTab('解析'); }}
                      className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                        selectedErrorId === q.id 
                          ? 'border-brand-red bg-brand-lightred text-brand-darkred font-bold shadow-2xs' 
                          : 'border-gray-200 hover:border-brand-borderred hover:bg-white bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-3xs text-gray-400 mb-1.5">
                        <span className="font-semibold text-brand-red">{q.category}</span>
                        <span className="text-red-600 bg-red-50 border border-red-100 px-1 py-0.2 rounded font-extrabold">累计错 1 次</span>
                      </div>
                      <p className="text-gray-800 line-clamp-2 leading-relaxed font-medium">{q.stem}</p>
                    </div>
                  ))}
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
                              <p className="font-extrabold text-gray-800">精选名师关联多媒体视频与图文：</p>
                              <div className="flex gap-3">
                                <a href="#video-mock" onClick={(e) => { e.preventDefault(); alert('正在准备大纲精讲：教研特级讲师《微格肺炎病理生理鉴别法（大叶、小叶与间质肺炎）》（12分钟）'); }} className="p-3 border border-brand-borderred/20 rounded text-center block flex-1 bg-brand-lightred/20 hover:bg-brand-lightred/40 transition-colors">
                                  <span className="block text-2xl mb-1">🎬</span>
                                  <span className="text-3xs font-extrabold text-brand-darkred block">微课精讲视频</span>
                                </a>
                                <a href="#text-mock" onClick={(e) => { e.preventDefault(); alert('图文大纲速记卡：《二十四字诀秒杀呼吸系统炎症考点》已为你保存在书签'); }} className="p-3 border border-brand-borderred/20 rounded text-center block flex-1 bg-brand-lightred/20 hover:bg-brand-lightred/40 transition-colors">
                                  <span className="block text-2xl mb-1">📝</span>
                                  <span className="text-3xs font-extrabold text-brand-darkred block">考点速记脑图</span>
                                </a>
                              </div>
                            </div>

                            <div className="pt-2">
                              <button 
                                onClick={() => {
                                  alert(`正在匹配题库...已为你提取针对【${selectedQ.knowledgePoint}】考点的 3 道历年名校统考真题。即刻进入日常练习模式进行答题验证！`);
                                  handleStartPhase('plan_01', 'p2');
                                }}
                                className="w-full py-2.5 bg-brand-red hover:bg-brand-darkred text-white rounded font-bold text-2xs flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors"
                              >
                                立即开始相似真题加练自测
                              </button>
                            </div>
                          </div>
                        )}

                        {remediationTab === '复习记录' && (
                          <div className="space-y-4 text-xs text-gray-500">
                            <p className="font-extrabold text-gray-800">此考点在你的学习路径中的流转历程：</p>
                            <div className="space-y-3.5 pl-4 border-l-2 border-brand-borderred/20">
                              <div className="relative">
                                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-red ring-4 ring-brand-lightred" />
                                <p className="text-3xs font-extrabold text-brand-darkred">今日测验错题生成 09:30</p>
                                <p className="text-3xs text-gray-500 mt-0.5">在 阶段一 模拟测验中做错该题，教务系统智能归纳其属于弱项考点，自动触发了相似题 AI 加练包。</p>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-gold ring-4 ring-amber-50" />
                                <p className="text-3xs font-extrabold text-brand-gold">今日激活微课学习 10:15</p>
                                <p className="text-3xs text-gray-400 mt-0.5">阅读并学习了针对 {selectedQ.knowledgePoint} 考点的大纲解析，顺利进行了图文卡速读。</p>
                              </div>
                            </div>
                          </div>
                        )}
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

          {/* Core Score card */}
          {(() => {
            const attempt = testAttempts[0] || {
              score: 80,
              correctCount: 4,
              totalQuestions: 5,
              weakPoints: ['药理学 - 糖皮质激素抗炎机制'],
              completedAt: '今日'
            };

            const passed = attempt.score >= 80;

            return (
              <div className="space-y-6">
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
                      诊断报告时间：{attempt.completedAt} · 本次统作答
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
          })()}
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

          {/* Historical Logs summary */}
          <div className="border border-brand-borderred/30 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-brand-lightred/10 space-y-3 shadow-2xs">
            <h4 className="text-xs font-black text-brand-darkred flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-red" />
              历次模拟考测试 & 日常练习沉淀档案
            </h4>
            
            {testAttempts.length === 0 ? (
              <p className="text-3xs text-gray-400 font-medium">暂无历史答题提交数据。</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {testAttempts.map(att => {
                  const plan = plans.find(p => p.id === att.planId);
                  return (
                    <div key={att.id} className="py-3 flex items-center justify-between text-2xs gap-4">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-brand-darkred">{plan?.name || '心肺系统大纲辅导计划'}</p>
                        <p className="text-3xs text-gray-400">
                          类型：{att.type === 'quiz' ? '综合模拟测验' : '核心大纲自测练习'} · 提交时间：{att.completedAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black font-mono text-brand-red text-xs block">{att.score} 分</span>
                        <span className="text-3xs text-gray-400 font-bold">答对 {att.correctCount}/{att.totalQuestions} 题</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
