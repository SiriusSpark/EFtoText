import request from '@/utils/request'

// 获取事件图列表
export function getEventGraphList() {
  return request({
    url: '/api/event_graphs',
    method: 'get'
  })
}

// 获取事件图详情
export function getEventGraphDetail(id) {
  return request({
    url: `/api/event_graphs/${id}`,
    method: 'get'
  })
}

// 创建事件图
export function createEventGraph(data) {
  return request({
    url: '/api/event_graphs',
    method: 'post',
    data
  })
}

// 更新事件图
export function updateEventGraph(id, data) {
  return request({
    url: `/api/event_graphs/${id}`,
    method: 'put',
    data
  })
}

// 删除事件图
export function deleteEventGraph(id) {
  return request({
    url: `/api/event_graphs/${id}`,
    method: 'delete'
  })
}

// 获取事件图元素
export function getEventGraphElements(graphId) {
  return request({
    url: `/api/graph/${graphId}/data`,
    method: 'get'
  })
}

// 获取事件图元素（通过ID）
export function getEventGraphElementsById(graphId, elementId) {
  return request({
    url: `/api/graph/${graphId}/data/${elementId}`,
    method: 'get'
  })
}

// 保存事件图元素
export function saveEventGraphElements(graphId, data) {
  return request({
    url: `/api/graph/${graphId}/data`,
    method: 'post',
    data
  })
} 

// 获取事件节点详情
export function getEventNode(nodeId) {
  return request({
    url: `/api/graph/nodes/${nodeId}`,
    method: 'get'
  })
}

// 创建事件节点
export function createEventNode(data) {
  return request({
    url: '/api/graph/nodes',
    method: 'post',
    data
  })
}

// 更新事件节点
export function updateEventNode(nodeId, data) {
  return request({
    url: `/api/graph/nodes/${nodeId}`,
    method: 'put',
    data
  })
}

// 删除事件节点
export function deleteEventNode(nodeId) {
  return request({
    url: `/api/graph/nodes/${nodeId}`,
    method: 'delete'
  })
}

// 获取事件关系详情
export function getEventEdge(edgeId) {
  return request({
    url: `/api/graph/edges/${edgeId}`,
    method: 'get'
  })
}

// 创建事件关系
export function createEventEdge(data) {
  return request({
    url: '/api/graph/edges',
    method: 'post',
    data
  })
}

// 更新事件关系
export function updateEventEdge(edgeId, data) {
  return request({
    url: `/api/graph/edges/${edgeId}`,
    method: 'put',
    data
  })
}

// 删除事件关系
export function deleteEventEdge(edgeId) {
  return request({
    url: `/api/graph/edges/${edgeId}`,
    method: 'delete'
  })
} 