import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config';
import Modal from '../Modal';

const { apiUrl } = config;

const NodeManagement = () => {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({
    storage: '',
    nodeName: '',
  });
  const [message, setMessage] = useState('');
  const [uptimeStart, setUptimeStart] = useState(0);
  const [downtimeStart, setDowntimeStart] = useState(0);
  const count = 5; // Number of uptime/downtime records to fetch

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      const response = await axios.get(`${apiUrl}/nodes/all`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNodes(response.data);
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    }
  };

  const fetchNodeDetails = async (nodeId, start, type) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      const response = await axios.get(`${apiUrl}/nodemanagement/node/${nodeId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: {
          start,
          count,
        },
      });

      const data = response.data;

      setSelectedNode(data);
      setFormData({
        storage: data.storageStats ? data.storageStats.availableStorage : '',
        nodeName: data.nodeName,
      });

      // Update start index based on type (uptime or downtime)
      if (type === 'uptime') setUptimeStart(start);
      if (type === 'downtime') setDowntimeStart(start);

    } catch (error) {
      console.error('Failed to fetch node details:', error);
    }
  };

  const handleNodeSelect = async (nodeId) => {
    fetchNodeDetails(nodeId, 0, 'uptime'); // Fetch initial details with start 0
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !selectedNode) return;

    try {
      await axios.put(`${apiUrl}/nodemanagement/node/${selectedNode.nodeId}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessage('Node updated successfully');
      fetchNodes(); // Refresh the node list
      setSelectedNode(null); // Close modal
    } catch (error) {
      console.error('Failed to update node:', error);
      setMessage('Failed to update node');
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Are you sure you want to delete this node? This action cannot be undone.')) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      await axios.delete(`${apiUrl}/nodemanagement/node/${nodeId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessage('Node deleted successfully');
      fetchNodes(); // Refresh the node list
    } catch (error) {
      console.error('Failed to delete node:', error);
      setMessage('Failed to delete node');
    }
  };

  const calculateStoragePercentage = (used, available) => {
    return available > 0 ? (used / available) * 100 : 0;
  };

  const getStorageBarColor = (usedPercentage) => {
    if (usedPercentage < 50) return { used: 'blue', free: 'green' };
    if (usedPercentage >= 50 && usedPercentage < 75) return { used: 'blue', free: 'yellow' };
    return { used: 'blue', free: 'red' };
  };

  return (
    <div>
      <h1>Node Management Dashboard</h1>
      <div>
        {nodes.map((node) => (
          <div key={node.id} onClick={() => handleNodeSelect(node.id)} style={styles.nodeCard}>
            <h2>{node.nodeName}</h2>
            <p>Online: {node.isOnline ? 'Yes' : 'No'}</p>
            <p>Endpoint: {node.endpoint}</p>
          </div>
        ))}
      </div>
      {selectedNode && (
        <Modal onClose={() => setSelectedNode(null)}>
          <form onSubmit={handleFormSubmit}>
            <h2>{selectedNode.nodeName}</h2>
            <p>Region: {selectedNode.region}</p>
            <p>Online: {selectedNode.isOnline ? 'Yes' : 'No'}</p>
            <p>Endpoint: {selectedNode.endpoint}</p>
            <h3>Storage Stats</h3>
            <div style={{ marginTop: '10px' }}>
              <p>Used Storage: {selectedNode.storageStats.usedStorage} / {selectedNode.storageStats.availableStorage} bytes</p>
              <div style={{ width: '100%', height: '30px', backgroundColor: getStorageBarColor(calculateStoragePercentage(selectedNode.storageStats.usedStorage, selectedNode.storageStats.availableStorage)).free, position: 'relative', borderRadius: '5px' }}>
                <div style={{ width: `${calculateStoragePercentage(selectedNode.storageStats.usedStorage, selectedNode.storageStats.availableStorage)}%`, height: '100%', backgroundColor: getStorageBarColor(calculateStoragePercentage(selectedNode.storageStats.usedStorage, selectedNode.storageStats.availableStorage)).used, borderRadius: '5px 0 0 5px' }}></div>
              </div>
            </div>
            <h3>Allocated File Storage</h3>
            <div style={{ marginTop: '10px' }}>
              <p>Used: {selectedNode.allocatedFileStorage.usedStorage} / {selectedNode.allocatedFileStorage.availableStorage} bytes</p>
              <div style={{ width: '100%', height: '30px', backgroundColor: getStorageBarColor(calculateStoragePercentage(selectedNode.allocatedFileStorage.usedStorage, selectedNode.allocatedFileStorage.availableStorage)).free, position: 'relative', borderRadius: '5px' }}>
                <div style={{ width: `${calculateStoragePercentage(selectedNode.allocatedFileStorage.usedStorage, selectedNode.allocatedFileStorage.availableStorage)}%`, height: '100%', backgroundColor: getStorageBarColor(calculateStoragePercentage(selectedNode.allocatedFileStorage.usedStorage, selectedNode.allocatedFileStorage.availableStorage)).used, borderRadius: '5px 0 0 5px' }}></div>
              </div>
            </div>
            <h3>Allocated Deployment Storage</h3>
            <div style={{ marginTop: '10px' }}>
              <p>Used: {selectedNode.allocatedDeploymentStorage.usedStorage} / {selectedNode.allocatedDeploymentStorage.availableStorage} bytes</p>
              <div style={{ width: '100%', height: '30px', backgroundColor: getStorageBarColor(calculateStoragePercentage(selectedNode.allocatedDeploymentStorage.usedStorage, selectedNode.allocatedDeploymentStorage.availableStorage)).free, position: 'relative', borderRadius: '5px' }}>
                <div style={{ width: `${calculateStoragePercentage(selectedNode.allocatedDeploymentStorage.usedStorage, selectedNode.allocatedDeploymentStorage.availableStorage)}%`, height: '100%', backgroundColor: getStorageBarColor(calculateStoragePercentage(selectedNode.allocatedDeploymentStorage.usedStorage, selectedNode.allocatedDeploymentStorage.availableStorage)).used, borderRadius: '5px 0 0 5px' }}></div>
              </div>
            </div>
            <h3>Uptime</h3>
            <ul>
              {selectedNode.uptime.map((time, index) => (
                <li key={index}>{new Date(time).toLocaleString()}</li>
              ))}
            </ul>
            <button type="button" onClick={() => fetchNodeDetails(selectedNode.nodeId, uptimeStart + count, 'uptime')}>Next Uptime</button>
            {uptimeStart > 0 && (
              <button type="button" onClick={() => fetchNodeDetails(selectedNode.nodeId, uptimeStart - count, 'uptime')}>Previous Uptime</button>
            )}
            <h3>Downtime</h3>
            <ul>
              {selectedNode.downtime.map((downtime, index) => (
                <li key={index}>
                  <p>Critical Level: {downtime["Critical level"]}</p>
                  <p>Reason: {downtime.Reason}</p>
                  <p>Timestamp: {new Date(downtime.Timestamp).toLocaleString()}</p> {/* Corrected closing tag */}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => fetchNodeDetails(selectedNode.nodeId, downtimeStart + count, 'downtime')}>Next Downtime</button>
            {downtimeStart > 0 && (
              <button type="button" onClick={() => fetchNodeDetails(selectedNode.nodeId, downtimeStart - count, 'downtime')}>Previous Downtime</button>
            )}
            <h3>Availability</h3>
            <p>Critical Level: {selectedNode.availability["Critical level"]}</p>
            <p>Reason: {selectedNode.availability.Reason}</p>
            <p>Timestamp: {new Date(selectedNode.availability.Timestamp).toLocaleString()}</p>
            <label>
              Node Name:
              <input
                type="text"
                name="nodeName"
                value={formData.nodeName}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Storage:
              <input
                type="number"
                name="storage"
                value={formData.storage}
                onChange={handleInputChange}
              />
            </label>
            <button type="submit">Update</button>
            <button type="button" onClick={() => handleDeleteNode(selectedNode.nodeId)} style={styles.deleteButton}>Delete</button>
            {message && <p>{message}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
};

const styles = {
  nodeCard: {
    border: '1px solid #ccc',
    padding: '10px',
    margin: '10px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: 'red',
    color: 'white',
    marginTop: '10px',
  },
};

export default NodeManagement;
