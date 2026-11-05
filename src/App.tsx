import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, TabType } from './types';
import {
  loadIssues,
  saveIssues,
  resetDemoData,
  getVotedPlusOnes,
  saveVotedPlusOnes,
  getFixVotes,
  saveFixVotes,
} from './utils/storage';
import {
  computeDeterministicPriority,
  computeIssuesHash,
  getCachedPriorityRankings,
  saveCachedPriorityRankings,
  fetchAiPriorityRankings,
} from './utils/priority';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { FeedScreen } from './components/FeedScreen';
import { ReportScreen } from './components/ReportScreen';
import { AuthorityScreen } from './components/AuthorityScreen';
import { IssuePage } from './components/IssuePage';

export default function App() {
  const [issues, setIssues] = useState<Issue[]>(() => loadIssues());
  const [currentTab, setCurrentTab] = useState<TabType>('feed');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [votedPlusOnes, setVotedPlusOnes] = useState<Record<string, boolean>>(
    () => getVotedPlusOnes()
  );
  const [fixVotes, setFixVotes] = useState<Record<string, 'yes' | 'no'>>(() =>
    getFixVotes()
  );
  const [isReranking, setIsReranking] = useState<boolean>(false);

  // Sync issues to localStorage
  useEffect(() => {
    saveIssues(issues);
  }, [issues]);

  useEffect(() => {
    saveVotedPlusOnes(votedPlusOnes);
  }, [votedPlusOnes]);

  useEffect(() => {
    saveFixVotes(fixVotes);
  }, [fixVotes]);

  const openCount = issues.filter((i) => i.status === 'open').length;
  const fixedCount = issues.filter((i) => i.status === 'fixed').length;

  const activeIssue = selectedIssueId
    ? issues.find((i) => i.id === selectedIssueId) || null
    : null;

  // Feature 1: AI Priority Ranking Evaluation & Debounced Caching
  const debounceTimerRef = useRef<any>(null);

  const applyRankingsToState = useCallback((rankings: Record<string, { priority: number; reason: string }>) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.status !== 'open') return issue;
        const ranked = rankings[issue.id];
        if (ranked) {
          return {
            ...issue,
            priority: ranked.priority,
            priorityReason: ranked.reason,
            isAiPriority: true,
          };
        }
        // Fallback to deterministic
        const det = computeDeterministicPriority(issue);
        return {
          ...issue,
          priority: issue.priority || det.priority,
          priorityReason: issue.priorityReason || det.reason,
        };
      })
    );
  }, []);

  const triggerAiPriorityRanking = useCallback(async (currentIssues: Issue[]) => {
    const openIssues = currentIssues.filter((i) => i.status === 'open');
    if (openIssues.length === 0) return;

    const hash = computeIssuesHash(currentIssues);
    const cached = getCachedPriorityRankings(hash);
    if (cached) {
      applyRankingsToState(cached);
      return;
    }

    try {
      setIsReranking(true);
      const rankings = await fetchAiPriorityRankings(openIssues);
      if (Object.keys(rankings).length > 0) {
        saveCachedPriorityRankings(hash, rankings);
        applyRankingsToState(rankings);
      }
    } catch (err) {
      console.warn('AI priority ranking failed, deterministic formula preserved:', err);
    } finally {
      setIsReranking(false);
    }
  }, [applyRankingsToState]);

  // Debounce trigger whenever issues, plusOnes, or statuses change (2-second debounce)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      triggerAiPriorityRanking(issues);
    }, 2000);

    return () => clearTimeout(debounceTimerRef.current);
  }, [issues, triggerAiPriorityRanking]);

  // Manual "Re-rank with AI" button handler
  const handleManualRerank = async () => {
    const openIssues = issues.filter((i) => i.status === 'open');
    if (openIssues.length === 0) return;

    try {
      setIsReranking(true);
      const rankings = await fetchAiPriorityRankings(openIssues);
      if (Object.keys(rankings).length > 0) {
        const hash = computeIssuesHash(issues);
        saveCachedPriorityRankings(hash, rankings);
        applyRankingsToState(rankings);
      }
    } catch (err) {
      console.warn('Manual AI rerank failed:', err);
    } finally {
      setIsReranking(false);
    }
  };

  // Feature B: +1 Toggle Logic (One upvote per device per issue)
  const handleTogglePlusOne = (issueId: string) => {
    const isCurrentlyVoted = !!votedPlusOnes[issueId];

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue;
        const newCount = Math.max(0, issue.plusOnes + (isCurrentlyVoted ? -1 : 1));
        const updatedIssue = { ...issue, plusOnes: newCount };
        // Recalculate deterministic baseline
        const det = computeDeterministicPriority(updatedIssue);
        return {
          ...updatedIssue,
          priority: issue.isAiPriority ? issue.priority : det.priority,
          priorityReason: issue.isAiPriority ? issue.priorityReason : det.reason,
        };
      })
    );

    setVotedPlusOnes((prev) => {
      const next = { ...prev };
      if (isCurrentlyVoted) {
        delete next[issueId];
      } else {
        next[issueId] = true;
      }
      return next;
    });
  };

  // Vote on "Is it really fixed?" (Yes vs No)
  const handleVoteFix = (issueId: string, vote: 'yes' | 'no') => {
    const previousVote = fixVotes[issueId];
    if (previousVote === vote) return;

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue;
        let newYes = issue.fixYes;
        let newNo = issue.fixNo;

        if (previousVote === 'yes') newYes = Math.max(0, newYes - 1);
        if (previousVote === 'no') newNo = Math.max(0, newNo - 1);

        if (vote === 'yes') newYes += 1;
        if (vote === 'no') newNo += 1;

        return {
          ...issue,
          fixYes: newYes,
          fixNo: newNo,
        };
      })
    );

    setFixVotes((prev) => ({
      ...prev,
      [issueId]: vote,
    }));
  };

  // New Issue Created from Report Screen
  const handleIssueCreated = (newIssue: Issue) => {
    const det = computeDeterministicPriority(newIssue);
    const completeIssue: Issue = {
      ...newIssue,
      priority: det.priority,
      priorityReason: det.reason,
      isAiPriority: false,
    };

    setIssues((prev) => [completeIssue, ...prev]);

    setVotedPlusOnes((prev) => ({
      ...prev,
      [newIssue.id]: true,
    }));

    setSelectedIssueId(null);
    setCurrentTab('feed');
  };

  // Feature 3: "+1 that issue instead" handler from DuplicateWarningSheet
  const handleUpvoteExisting = (existingIssue: Issue) => {
    // Add user's +1 under one-per-device rule if not already voted
    if (!votedPlusOnes[existingIssue.id]) {
      handleTogglePlusOne(existingIssue.id);
    }
    // Navigate straight to that issue's page
    setSelectedIssueId(existingIssue.id);
  };

  // Feature 2: Shared Mark Fixed Handler (Used by both Issue Page and Authority Screen)
  const handleMarkFixed = (
    issueId: string,
    photoAfter: string,
    aiVerdict?: 'fixed' | 'not_fixed' | 'unsure',
    aiReason?: string
  ) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue;
        return {
          ...issue,
          status: 'fixed',
          photoAfter,
          fixedAt: Date.now(),
          fixYes: 1,
          fixNo: 0,
        };
      })
    );
  };

  // Reset demo data
  const handleResetDemo = () => {
    const fresh = resetDemoData();
    setIssues(fresh);
    setVotedPlusOnes({});
    setFixVotes({});
    setSelectedIssueId(null);
    setCurrentTab('feed');
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#EDEDE8] flex flex-col selection:bg-[#C8F169]/30">
      {/* Top Header with Hamburger & Drawer */}
      <Header
        onResetDemo={handleResetDemo}
        openCount={openCount}
        fixedCount={fixedCount}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-md mx-auto relative">
        <AnimatePresence mode="wait">
          {activeIssue ? (
            <IssuePage
              key={activeIssue.id}
              issue={activeIssue}
              isVotedPlusOne={!!votedPlusOnes[activeIssue.id]}
              onTogglePlusOne={handleTogglePlusOne}
              deviceFixVote={fixVotes[activeIssue.id]}
              onVoteFix={handleVoteFix}
              onMarkFixed={handleMarkFixed}
              onBack={() => setSelectedIssueId(null)}
            />
          ) : (
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {currentTab === 'feed' && (
                <FeedScreen
                  issues={issues}
                  votedPlusOnes={votedPlusOnes}
                  onTogglePlusOne={handleTogglePlusOne}
                  onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                  onNavigateToReport={() => setCurrentTab('report')}
                  onRerankWithAi={handleManualRerank}
                  isReranking={isReranking}
                />
              )}

              {currentTab === 'report' && (
                <ReportScreen
                  existingIssues={issues}
                  onIssueCreated={handleIssueCreated}
                  onUpvoteExisting={handleUpvoteExisting}
                  onCancel={() => setCurrentTab('feed')}
                />
              )}

              {currentTab === 'authority' && (
                <AuthorityScreen
                  issues={issues}
                  onMarkFixed={handleMarkFixed}
                  onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Pill Bottom Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedIssueId(null);
          setCurrentTab(tab);
        }}
        openCount={openCount}
      />
    </div>
  );
}
