import { describe, expect, it } from 'vitest'
import { buildPlan, nextReadyTask, progress, runOfflineAgent, type AgentMission, type Task } from './domain'

const mission: AgentMission = {
  name: 'Prepare product launch',
  objective: 'Prepare a launch plan for the SYNTRAX website',
  description: 'The site needs a clear overview, pricing, and support details.',
  outcome: 'A reviewed launch checklist',
  priority: 'High',
  due: '2026-11-01',
  criteria: ['Overview is written', 'Support details are reviewed'],
  constraints: 'No external services',
}

describe('local mission orchestration', () => {
  it('creates a deterministic four-agent dependency chain', () => {
    const tasks = buildPlan((() => { let i = 0; return () => `task-${++i}` })())
    expect(tasks.map(task => task.agent)).toEqual(['ORACLE', 'SCOUT', 'ARCHITECT', 'SENTINEL'])
    expect(tasks.map(task => task.dependsOn)).toEqual([[], ['task-1'], ['task-2'], ['task-3']])
    expect(nextReadyTask(tasks)?.agent).toBe('ORACLE')
  })

  it('only selects work after its dependency is complete', () => {
    const tasks: Task[] = buildPlan((() => { let i = 0; return () => `t${++i}` })())
    tasks[0] = { ...tasks[0], state: 'done' }
    expect(nextReadyTask(tasks)?.agent).toBe('SCOUT')
    tasks[1] = { ...tasks[1], state: 'failed' }
    expect(nextReadyTask(tasks)).toBeUndefined()
    tasks[1] = { ...tasks[1], state: 'ready' }
    expect(nextReadyTask(tasks)?.agent).toBe('SCOUT')
  })

  it('derives progress from completed tasks and handles empty plans', () => {
    const tasks = buildPlan((() => { let i = 0; return () => `t${++i}` })())
    expect(progress([])).toBe(0)
    expect(progress(tasks)).toBe(0)
    expect(progress(tasks.map(task => ({ ...task, state: 'done' as const })))).toBe(100)
  })

  it('runs four distinct offline operations against the supplied mission brief', () => {
    const oracle = runOfflineAgent('ORACLE', mission)
    const scout = runOfflineAgent('SCOUT', mission, [oracle])
    const architect = runOfflineAgent('ARCHITECT', mission, [oracle, scout])
    const sentinel = runOfflineAgent('SENTINEL', mission, [oracle, scout, architect])

    expect(oracle).toContain('MISSION CHARTER · Prepare product launch')
    expect(oracle).toContain('Overview is written')
    expect(scout).toContain('No internet or external sources were accessed')
    expect(scout).toContain('support')
    expect(architect).toContain('WORKING DRAFT · Prepare product launch')
    expect(architect).toContain('A reviewed launch checklist')
    expect(sentinel).toContain('Prior local agent outputs are available (3/3)')
    expect(sentinel).toContain('attach evidence or an owner confirmation')
    expect(sentinel).toContain('No external tests')
  })

  it('reports missing acceptance criteria without claiming the mission passed', () => {
    const result = runOfflineAgent('SENTINEL', { ...mission, criteria: [] }, [])
    expect(result).toContain('BLOCKED: add at least one observable success criterion')
    expect(result).toContain('RECOMMENDATION: resolve REVIEW/FAIL items')
  })
})
