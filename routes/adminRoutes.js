// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticateAdmin } = require('../middleware/auth');

// GET statistiques
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    // Agrégation par statut en une seule requête
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } }
    ]);

    const byStatus = {};
    statusCounts.forEach(({ _id, count, revenue }) => {
      byStatus[_id] = { count, revenue };
    });

    const deliveredRevenue = byStatus['livré']?.revenue || 0;
    const totalOrders      = await Order.countDocuments();

    res.json({
      totalRevenue:       deliveredRevenue,
      totalOrders,
      pendingOrders:      byStatus['en attente']?.count  || 0,
      confirmedOrders:    byStatus['confirmé']?.count    || 0,
      inDeliveryOrders:   byStatus['en livraison']?.count || 0,
      deliveredOrders:    byStatus['livré']?.count       || 0,
      returnOrders:       byStatus['retour']?.count      || 0,
      cancelledOrders:    byStatus['annulé']?.count      || 0,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST reset des statistiques (optionnel - supprime toutes les commandes livrées/retournées)
router.post('/stats/reset', authenticateAdmin, async (req, res) => {
  try {
    const result = await Order.deleteMany({ 
      status: { $in: ['livré', 'retour'] } 
    });
    
    res.json({ 
      message: 'Statistiques réinitialisées', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
