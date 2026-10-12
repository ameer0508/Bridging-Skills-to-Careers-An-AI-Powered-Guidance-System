# Frontend files not reachable from the application

These 142 source files under `frontend/src` are not imported, directly or indirectly, from
`src/main.tsx`. They are not part of the production bundle. **None has been deleted.** This list
exists so a clean-up can be decided file by file instead of blindly.

How the list was produced: starting at `src/main.tsx`, every static `import`/`export ... from`
and dynamic `import()` was followed (relative paths and the `@/` alias). A file that is only
referenced in some other way, for example by a build plugin, would be listed here by mistake,
so check before removing anything.

| Group | Files | Recommendation |
|---|---|---|
| Re-export files (`index.ts`) | 42 | Safe to keep. |
| Design-system components and tokens | 37 | Keep. |
| Feature and page components that no route renders | 60 | Review one by one before removing. |
| Test files | 1 | Keep until a frontend test runner is added, then run or rewrite them. |
| Other modules | 2 | Review individually. |

## Re-export files (`index.ts`) (42)

These only re-export other modules. They are unused because the application imports the modules directly. They contain no logic.

**Recommendation:** Safe to keep. Removing them changes nothing at run time; do it only as part of a deliberate tidy-up.

- `components/base/Accordion/index.ts`
- `components/base/Breadcrumb/index.ts`
- `components/base/Chip/index.ts`
- `components/base/Divider/index.ts`
- `components/base/Drawer/index.ts`
- `components/base/DropdownMenu/index.ts`
- `components/base/Pagination/index.ts`
- `components/base/Popover/index.ts`
- `components/base/Radio/index.ts`
- `components/base/Select/index.ts`
- `components/base/Skeleton/index.ts`
- `components/base/Tabs/index.ts`
- `components/base/index.ts`
- `components/composite/EmptyState/index.ts`
- `components/composite/ErrorState/index.ts`
- `components/composite/index.ts`
- `components/index.ts`
- `components/primitives/AspectRatio/index.ts`
- `components/primitives/Box/index.ts`
- `components/primitives/Container/index.ts`
- `components/primitives/Flex/index.ts`
- `components/primitives/Grid/index.ts`
- `components/primitives/Heading/index.ts`
- `components/primitives/ScrollArea/index.ts`
- `components/primitives/Separator/index.ts`
- `components/primitives/Spacer/index.ts`
- `components/primitives/Stack/index.ts`
- `components/primitives/Text/index.ts`
- `components/primitives/VisuallyHidden/index.ts`
- `components/primitives/index.ts`
- `features/ai/components/index.ts`
- `features/careers/components/index.ts`
- `features/recommendations/components/index.ts`
- `features/skills/components/index.ts`
- `features/user/components/index.ts`
- `layouts/index.ts`
- `workspaces/AICareerArchitectWorkspace/index.ts`
- `workspaces/AnalyticsWorkspace/index.ts`
- `workspaces/CareerIntelligenceWorkspace/index.ts`
- `workspaces/HomeWorkspace/index.ts`
- `workspaces/LearningJourneyWorkspace/index.ts`
- `workspaces/SettingsWorkspace/index.ts`

## Design-system components and tokens (37)

Reusable building blocks (buttons, inputs, layout primitives, tokens) that no screen currently uses.

**Recommendation:** Keep. They are part of the component library and cost nothing in the production bundle, because unused modules are not bundled.

- `components/base/Accordion/Accordion.tsx`
- `components/base/Breadcrumb/Breadcrumb.tsx`
- `components/base/Chip/Chip.tsx`
- `components/base/Divider/Divider.tsx`
- `components/base/Drawer/Drawer.tsx`
- `components/base/DropdownMenu/ContextMenu.tsx`
- `components/base/DropdownMenu/DropdownMenu.tsx`
- `components/base/Pagination/Pagination.tsx`
- `components/base/Popover/Popover.tsx`
- `components/base/Radio/Radio.tsx`
- `components/base/Radio/RadioGroup.tsx`
- `components/base/Select/MultiSelect.tsx`
- `components/base/Select/Select.tsx`
- `components/base/Skeleton/Skeleton.tsx`
- `components/base/Tabs/Tabs.tsx`
- `components/composite/EmptyState/EmptyState.tsx`
- `components/composite/ErrorState/ErrorState.tsx`
- `components/primitives/AspectRatio/AspectRatio.tsx`
- `components/primitives/Box/Box.tsx`
- `components/primitives/Container/Container.tsx`
- `components/primitives/Flex/Flex.tsx`
- `components/primitives/Grid/Grid.tsx`
- `components/primitives/Heading/Heading.tsx`
- `components/primitives/ScrollArea/ScrollArea.tsx`
- `components/primitives/Separator/Separator.tsx`
- `components/primitives/Spacer/Spacer.tsx`
- `components/primitives/Stack/Stack.tsx`
- `components/primitives/Text/Text.tsx`
- `components/primitives/VisuallyHidden/VisuallyHidden.tsx`
- `tokens/colors.ts`
- `tokens/index.ts`
- `tokens/motion.ts`
- `tokens/radii.ts`
- `tokens/shadows.ts`
- `tokens/spacing.ts`
- `tokens/typography.ts`
- `tokens/zIndexes.ts`

## Feature and page components that no route renders (60)

Earlier or alternative versions of screens and panels. Several contain built-in example data. None is rendered, so none of that data reaches a user.

**Recommendation:** Review one by one before removing. Some may hold layout work worth reusing; any that is brought back must be wired to real data or labelled as a sample first.

- `features/ai/components/AICareerArchitectPage.tsx`
- `features/ai/components/AICareerContextPanel.tsx`
- `features/ai/components/AIWorkspaceHeader.tsx`
- `features/ai/components/ChatWindow.tsx`
- `features/ai/components/ConversationSidebar.tsx`
- `features/ai/components/PromptSuggestions.tsx`
- `features/analytics/components/AnalyticsDashboardPage.tsx`
- `features/analytics/components/ExecutiveInsightsPanel.tsx`
- `features/analytics/components/ForecastCards.tsx`
- `features/analytics/components/MarketIntelligencePanel.tsx`
- `features/analytics/components/SalaryProjectionPanel.tsx`
- `features/analytics/components/WhatIfSimulator.tsx`
- `features/careers/components/CareerDetailModal.tsx`
- `features/careers/components/CareerFilters.tsx`
- `features/careers/components/CareerIntelligencePage.tsx`
- `features/careers/components/CareerObservatoryGrid.tsx`
- `features/careers/components/CareerTelemetryHUD.tsx`
- `features/careers/components/CareerWorkspaceHeader.tsx`
- `features/home/components/CareerOSMetricGrid.tsx`
- `features/home/components/CareerOSOrbitalField.tsx`
- `features/home/components/CareerOSPriorityBanner.tsx`
- `features/home/components/CareerOSRoadmapBlueprint.tsx`
- `features/home/components/CareerOSTelemetryHUD.tsx`
- `features/home/components/CommandConsoleLaunchpad.tsx`
- `features/home/components/PanoramicTelemetryDeck.tsx`
- `features/home/components/QuantumTrajectorySpine.tsx`
- `features/home/components/SovereignDirective.tsx`
- `features/home/components/SovereignHeroMonolith.tsx`
- `features/home/components/TacticalPipelineTerminals.tsx`
- `features/home/components/TacticalTrajectoryRibbon.tsx`
- `features/landing/components/FAQSection.tsx`
- `features/landing/components/FeatureShowcase.tsx`
- `features/landing/components/FinalCTASection.tsx`
- `features/landing/components/Footer.tsx`
- `features/landing/components/HeroSection.tsx`
- `features/landing/components/InteractiveCareerJourney.tsx`
- `features/landing/components/Navbar.tsx`
- `features/landing/components/StatisticsSection.tsx`
- `features/landing/components/TechShowcase.tsx`
- `features/landing/components/TestimonialsSection.tsx`
- `features/landing/components/WhySkillBridge.tsx`
- `features/recommendations/components/ActionRecommendationGrid.tsx`
- `features/recommendations/components/ImpactPredictionCard.tsx`
- `features/recommendations/components/LearningROICard.tsx`
- `features/recommendations/components/PriorityMatrix.tsx`
- `features/recommendations/components/RecommendationComparisonModal.tsx`
- `features/recommendations/components/RecommendationReasoningPanel.tsx`
- `features/recommendations/components/RecommendationSpotlight.tsx`
- `features/recommendations/components/RecommendationTelemetryHUD.tsx`
- `features/resume/components/ParsingStatus.tsx`
- `features/skills/components/CareerRelevancePanel.tsx`
- `features/skills/components/EmergingSkillSpotlight.tsx`
- `features/skills/components/SemanticSkillGraph.tsx`
- `features/skills/components/SkillClusterCards.tsx`
- `features/skills/components/SkillEvidenceModal.tsx`
- `features/skills/components/SkillNodeMatrix.tsx`
- `features/skills/components/SkillTelemetryHUD.tsx`
- `features/skills/components/TransferableSkillExplorer.tsx`
- `features/telemetry/components/CareerJourneyProgressionTimeline.tsx`
- `features/user/components/ProfilePage.tsx`

## Test files (1)

Unit test files. The frontend has no unit test runner configured, so these do not run. They are excluded from the type-check.

**Recommendation:** Keep until a frontend test runner is added, then run or rewrite them.

- `utils/storageService.test.ts`

## Other modules (2)

Hooks and utilities with no importer.

**Recommendation:** Review individually.

- `hooks/useAITelemetry.ts`
- `utils/queryUtils.ts`
