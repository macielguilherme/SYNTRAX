export type TaskState = 'pending' | 'ready' | 'running' | 'approval' | 'done' | 'failed'
export type Task = { id: string; title: string; agent: string; state: TaskState; dependsOn: string[]; result?: string }

export function buildPlan(makeId: () => string): Task[] {
  const tasks: Task[] = [
    { id: makeId(), title: 'Estruturar plano e dependências', agent: 'ORACLE', state: 'ready', dependsOn: [] },
    { id: makeId(), title: 'Pesquisar contexto e registrar lacunas', agent: 'SCOUT', state: 'pending', dependsOn: [] },
    { id: makeId(), title: 'Preparar artefato ou especificação', agent: 'ARCHITECT', state: 'pending', dependsOn: [] },
    { id: makeId(), title: 'Verificar critérios e relatório', agent: 'SENTINEL', state: 'pending', dependsOn: [] },
  ]
  tasks.slice(1).forEach((task, index) => { task.dependsOn = [tasks[index].id] })
  return tasks
}

export function nextReadyTask(tasks: Task[]): Task | undefined {
  return tasks.find(task => (task.state === 'ready' || task.state === 'pending') && task.dependsOn.every(id => tasks.find(dep => dep.id === id)?.state === 'done'))
}

export function progress(tasks: Task[]): number {
  return tasks.length ? Math.round(tasks.filter(task => task.state === 'done').length / tasks.length * 100) : 0
}

export type AgentMission = {
  name: string
  objective: string
  description: string
  outcome: string
  priority: string
  due: string
  criteria: string[]
  constraints: string
}

export function runOfflineAgent(agent: string, mission: AgentMission, priorResults: string[] = []): string {
  const criteria = mission.criteria.map(item => item.trim()).filter(Boolean)
  const context = [mission.objective, mission.description, mission.outcome, mission.constraints].filter(Boolean).join(' ')
  const stopWords = new Set(['para','com','uma','que','dos','das','the','this','with','from','into','and','will','your'])
  const keywords = [...new Set((context.match(/[\p{L}\p{N}][\p{L}\p{N}-]{3,}/gu) || []).map(word => word.toLowerCase()).filter(word => !stopWords.has(word)))].slice(0, 12)

  if (agent === 'ORACLE') {
    const actions = [
      'Confirm objective, scope, owner, and expected outcome.',
      'Gather context and identify missing information before making assumptions.',
      'Create the requested artifact from approved inputs and constraints.',
      'Review each success criterion and record evidence or an open item.',
    ]
    return [
      `MISSION CHARTER · ${mission.name}`,
      `Objective: ${mission.objective}`,
      `Expected outcome: ${mission.outcome || 'Not specified; confirm before treating the work as complete.'}`,
      `Priority: ${mission.priority}${mission.due ? ` · Deadline: ${mission.due}` : ''}`,
      '', 'EXECUTION SEQUENCE',
      ...actions.map((action, index) => `${index + 1}. ${action}`),
      '', `Success criteria to verify (${criteria.length}):`,
      ...(criteria.length ? criteria.map((item, index) => `- ${index + 1}. ${item}`) : ['- None supplied. Add measurable criteria before final acceptance.']),
      '', `Constraints: ${mission.constraints || 'None supplied; check for constraints with the mission owner.'}`,
      `Context to carry forward: ${mission.description || 'No background supplied.'}`,
    ].join('\n')
  }

  if (agent === 'SCOUT') {
    const questions = [
      !mission.description && 'What background, audience, or prior decisions should shape this work?',
      !mission.outcome && 'What concrete file, decision, or state counts as the expected outcome?',
      !criteria.length && 'What observable checks will show that the outcome is acceptable?',
      !mission.constraints && 'Are there budget, accessibility, privacy, technical, or timing constraints?',
    ].filter(Boolean) as string[]
    return [
      `CONTEXT REVIEW · ${mission.name}`,
      `Brief supplied: ${mission.description || mission.objective}`,
      `Terms to investigate: ${keywords.length ? keywords.join(', ') : 'Add more context to identify useful search terms.'}`,
      '', 'OPEN QUESTIONS',
      ...(questions.length ? questions.map((question, index) => `${index + 1}. ${question}`) : ['No required brief fields are missing; validate the supplied facts with their owner.']),
      '', 'EVIDENCE PLAN',
      '- Use source material supplied by the user or the team.',
      '- Record source, date, and the claim it supports before relying on a fact.',
      '- Keep unverified assumptions separate from confirmed information.',
      '', 'OFFLINE LIMIT',
      'No internet or external sources were accessed. This report organizes the supplied context; it does not claim independent research.',
    ].join('\n')
  }

  if (agent === 'ARCHITECT') {
    return [
      `WORKING DRAFT · ${mission.name}`,
      `Purpose: ${mission.objective}`,
      `Target outcome: ${mission.outcome || 'Confirm the desired deliverable with the mission owner.'}`,
      '', 'PROPOSED STRUCTURE',
      `1. Objective and audience\n   ${mission.objective}`,
      `2. Context\n   ${mission.description || 'Add background, current state, and relevant decisions.'}`,
      `3. Recommended approach\n   ${priorResults[0] ? 'Use the approved mission charter and keep each step in dependency order.' : 'Confirm scope and dependencies before producing the final artifact.'}`,
      `4. Constraints and assumptions\n   ${mission.constraints || 'No constraints supplied. List assumptions for review.'}`,
      `5. Acceptance checks\n   ${criteria.length ? criteria.map((item, index) => `   ${index + 1}. ${item}`).join('\n') : '   Add success criteria before approval.'}`,
      '', 'HANDOFF',
      'This is an editable starting draft based only on the mission brief. Replace prompts with verified project details before external use.',
    ].join('\n')
  }

  if (agent === 'SENTINEL') {
    const checks = [
      [`Mission name is present (${mission.name.trim().length > 0 ? 'PASS' : 'FAIL'}).`, mission.name.trim().length > 0],
      [`Objective is present (${mission.objective.trim().length > 0 ? 'PASS' : 'FAIL'}).`, mission.objective.trim().length > 0],
      [`Expected outcome is defined (${mission.outcome.trim() ? 'PASS' : 'REVIEW'}).`, Boolean(mission.outcome.trim())],
      [`Success criteria are recorded (${criteria.length} ${criteria.length === 1 ? 'criterion' : 'criteria'}).`, criteria.length > 0],
      [`Prior local agent outputs are available (${priorResults.length}/3).`, priorResults.length >= 3],
      [`Constraints are recorded (${mission.constraints.trim() ? 'PASS' : 'REVIEW'}).`, Boolean(mission.constraints.trim())],
    ]
    const failures = checks.filter(([, passed]) => !passed).length
    return [
      `QUALITY REVIEW · ${mission.name}`,
      `Local structure checks: ${checks.filter(([, passed]) => passed).length}/${checks.length} passed. ${failures} item(s) need attention.`,
      ...checks.map(([label]) => `- ${label}`),
      '', 'ACCEPTANCE CRITERIA',
      ...(criteria.length ? criteria.map((item, index) => `- REVIEW ${index + 1}: ${item} — attach evidence or an owner confirmation before claiming it is met.`) : ['- BLOCKED: add at least one observable success criterion.']),
      '', 'SCOPE OF THIS REVIEW',
      'Checks cover the mission record and local draft structure only. No external tests, factual verification, deployment checks, or real-world actions were run.',
      failures ? 'RECOMMENDATION: resolve REVIEW/FAIL items and obtain evidence before marking the mission accepted.' : 'RECOMMENDATION: attach evidence for each criterion; the local structure is ready for human review.',
    ].join('\n')
  }

  return `Unknown local agent: ${agent}`
}