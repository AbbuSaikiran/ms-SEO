import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'AI SEO Platform (Pillar)' },
    position: { x: 250, y: 50 },
    style: { background: '#111', color: '#fff', border: '1px solid #0066FF', borderRadius: '8px', padding: '10px' },
  },
  {
    id: '2',
    data: { label: 'Keyword Research Tools' },
    position: { x: 100, y: 150 },
    style: { background: '#111', color: '#fff', border: '1px solid #00FFAA', borderRadius: '8px', padding: '10px' },
  },
  {
    id: '3',
    data: { label: 'Content Writing AI' },
    position: { x: 400, y: 150 },
    style: { background: '#111', color: '#fff', border: '1px solid #5A00FF', borderRadius: '8px', padding: '10px' },
  },
  {
    id: '4',
    data: { label: 'Topic Clusters Strategy' },
    position: { x: 250, y: 250 },
    style: { background: '#111', color: '#fff', border: '1px solid #00FFAA', borderRadius: '8px', padding: '10px' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#0066FF' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#0066FF' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#00FFAA' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#5A00FF' } },
];

export default function TopicMap() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  return (
    <div style={{ height: '70vh', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#333" gap={16} />
        <Controls style={{ backgroundColor: '#111' }} />
      </ReactFlow>
    </div>
  );
}
