import React, { useEffect, useCallback, useState } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  Position,
  Background,
  Controls
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import apiClient from '../../api/apiClient';

// Configuración del layout
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 220;
const nodeHeight = 80;

const getLayoutedElements = (nodes: any[], edges: any[]) => {
  dagreGraph.setGraph({ rankdir: 'LR' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const GitFlowVisualizer = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/git-history/')
      .then((response) => {
        const data = response.data;
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!data.commits || data.commits.length === 0) {
            setError("No se encontraron commits en el historial.");
            setLoading(false);
            return;
        }

        const rawCommits = data.commits;
        const newNodes: any[] = [];
        const newEdges: any[] = [];

        rawCommits.forEach((commit: any) => {
          // Nodo
          newNodes.push({
            id: commit.id,
            data: { 
              label: (
                <div className="p-2 text-left w-full overflow-hidden">
                  <div className="flex justify-between items-center mb-1 border-b border-gray-600 pb-1">
                    <span className="text-blue-300 font-mono font-bold text-xs">{commit.id}</span>
                    <span className="text-[9px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">{commit.author}</span>
                  </div>
                  <div className="text-gray-100 text-xs font-medium line-clamp-2 leading-tight" title={commit.message}>
                    {commit.message}
                  </div>
                </div>
              ) 
            },
            position: { x: 0, y: 0 },
            style: { 
              background: '#1e293b', 
              color: 'white', 
              border: '1px solid #475569', 
              borderRadius: '8px',
              width: nodeWidth,
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            },
          });

          // Edges
          commit.parents.forEach((parentId: string) => {
            newEdges.push({
              id: `e-${parentId}-${commit.id}`,
              source: parentId,
              target: commit.id,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#64748b', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            });
          });
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setLoading(false);
      })
      .catch(err => {
          console.error("Error fetching git history:", err);
          setError(err.response?.data?.error || err.message || "Error desconocido al conectar con Git");
          setLoading(false);
      });
  }, [setNodes, setEdges]);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div className="h-[80vh] w-full bg-slate-950 border border-slate-800 rounded-lg shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* 👇 ESTILOS PERSONALIZADOS PARA FORZAR EL MODO OSCURO EN LOS CONTROLES 👇 */}
        <style>
            {`
                .react-flow__controls {
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
                .react-flow__controls-button {
                    background-color: #1e293b !important; /* Slate 800 */
                    border-bottom: 1px solid #475569 !important; /* Slate 600 */
                }
                .react-flow__controls-button:hover {
                    background-color: #334155 !important; /* Slate 700 */
                }
                .react-flow__controls-button svg {
                    fill: #e2e8f0 !important; /* Slate 200 (Blanco hueso) */
                }
                .react-flow__controls-button:last-child {
                    border-bottom: none !important;
                }
            `}
        </style>

        {/* Header */}
        <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur p-2 rounded border border-slate-600 shadow-lg">
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                Historial del Proyecto
            </h3>
        </div>

        {/* Loading State */}
        {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p>Cargando historial de Git...</p>
            </div>
        )}

        {/* Error State */}
        {error && !loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 text-white p-8 text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2">Error al cargar Git</h3>
                <p className="text-gray-400 mb-4 max-w-md">{error}</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition">
                    Reintentar
                </button>
            </div>
        )}

        {/* Graph */}
        {!loading && !error && (
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.1}
            >
                <Background color="#334155" gap={20} size={1} />
                <Controls showInteractive={false} /> {/* showInteractive oculta el boton de lock si no lo quieres */}
            </ReactFlow>
        )}
    </div>
  );
};

export default GitFlowVisualizer;