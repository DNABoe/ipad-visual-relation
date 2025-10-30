import type { Person, Connection, Group, Workspace } from './types'

export function generateSampleData(): Workspace {
  const group1 = {
    id: 'group-1',
    name: 'Leadership',
    color: 'blue' as const,
    x: 50,
    y: 50,
    width: 600,
    height: 300,
    createdAt: Date.now() - 100000,
  }

  const group2 = {
    id: 'group-2',
    name: 'Advisors',
    color: 'purple' as const,
    x: 700,
    y: 50,
    width: 500,
    height: 300,
    createdAt: Date.now() - 90000,
  }

  const persons: Person[] = [
    {
      id: 'person-1',
      name: 'Sarah Chen',
      position: 'Chief Executive Officer',
      score: 5,
      frameColor: 'green',
      x: 100,
      y: 100,
      groupId: 'group-1',
      createdAt: Date.now() - 80000,
    },
    {
      id: 'person-2',
      name: 'Marcus Rodriguez',
      position: 'Chief Technology Officer',
      score: 5,
      frameColor: 'green',
      x: 400,
      y: 100,
      groupId: 'group-1',
      createdAt: Date.now() - 70000,
    },
    {
      id: 'person-3',
      name: 'Emily Watson',
      position: 'VP of Product',
      score: 4,
      frameColor: 'orange',
      x: 100,
      y: 220,
      groupId: 'group-1',
      createdAt: Date.now() - 60000,
    },
    {
      id: 'person-4',
      name: 'James Park',
      position: 'VP of Engineering',
      score: 4,
      frameColor: 'orange',
      x: 400,
      y: 220,
      groupId: 'group-1',
      createdAt: Date.now() - 50000,
    },
    {
      id: 'person-5',
      name: 'Dr. Lisa Kumar',
      position: 'Strategic Advisor',
      score: 5,
      frameColor: 'white',
      x: 750,
      y: 100,
      groupId: 'group-2',
      createdAt: Date.now() - 40000,
    },
    {
      id: 'person-6',
      name: 'David Thompson',
      position: 'Board Member',
      score: 4,
      frameColor: 'white',
      x: 1000,
      y: 100,
      groupId: 'group-2',
      createdAt: Date.now() - 30000,
    },
    {
      id: 'person-7',
      name: 'Rachel Green',
      position: 'Technical Consultant',
      score: 3,
      frameColor: 'white',
      x: 750,
      y: 220,
      groupId: 'group-2',
      createdAt: Date.now() - 20000,
    },
    {
      id: 'person-8',
      name: 'Alex Martinez',
      position: 'Design Lead',
      score: 3,
      frameColor: 'red',
      x: 250,
      y: 450,
      createdAt: Date.now() - 10000,
    },
  ]

  const connections: Connection[] = [
    { id: 'conn-1', fromPersonId: 'person-1', toPersonId: 'person-2' },
    { id: 'conn-2', fromPersonId: 'person-1', toPersonId: 'person-3' },
    { id: 'conn-3', fromPersonId: 'person-1', toPersonId: 'person-4' },
    { id: 'conn-4', fromPersonId: 'person-2', toPersonId: 'person-4' },
    { id: 'conn-5', fromPersonId: 'person-3', toPersonId: 'person-8' },
    { id: 'conn-6', fromPersonId: 'person-1', toPersonId: 'person-5' },
    { id: 'conn-7', fromPersonId: 'person-5', toPersonId: 'person-6' },
    { id: 'conn-8', fromPersonId: 'person-5', toPersonId: 'person-7' },
  ]

  return { 
    persons, 
    connections, 
    groups: [group1, group2],
    collapsedBranches: []
  }
}
