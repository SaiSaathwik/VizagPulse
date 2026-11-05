import React, { useState, useEffect } from 'react';
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

  // Sync to localStorage
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

  // Toggle +1 logic (once per device, tapping again removes it)
  const handleTogglePlusOne = (issueId: string) => {
    const isCurrentlyVoted = !!votedPlusOnes[issueId];

    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue;
        return {
          ...issue,
          plusOnes: Math.max(
            0,
            issue.plusOnes + (isCurrentlyVoted ? -1 : 1)
          ),
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

  // Handle new issue submission from Report screen
  const handleIssueCreated = (newIssue: Issue) => {
    setIssues((prev) => [newIssue, ...prev]);

    setVotedPlusOnes((prev) => ({
      ...prev,
      [newIssue.id]: true,
    }));

    setSelectedIssueId(null);
    setCurrentTab('feed');
  };

  // Handle Authority marking an issue as fixed
  const handleMarkFixed = (
    issueId: string,
    photoAfter: string,
    aiCheckVerdict?: 'fixed' | 'not_fixed' | 'unsure',
    aiCheckReason?: string
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
                />
              )}

              {currentTab === 'report' && (
                <ReportScreen
                  onIssueCreated={handleIssueCreated}
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
