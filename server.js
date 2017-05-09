let path = require('path');
let express = require('express');
let bodyParser = require('body-parser');
let app = express();

let fees = require('./fees.json');
let orders = require('./orders.json');
let feesTable = { fees: {}, distributions: {}};

for (let fee of fees) {
	feesTable.fees[fee.order_item_type] = fee.fees;
	feesTable.distributions[fee.order_item_type] = fee.distributions;
}

app.set('port', 8000);
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/api', function(req, res) {
	res.end('<div>Kofile API challenge</div>');
});
// API routes
app.get('/api/order/fees', function(req, res) {
	orders = (req.query.orders) ? JSON.parse(req.query.orders) : null;

	getOrderFees(orders, function(err, data) {
		if (err)
			res.status(500).json({ error: err.reason });
		else
			res.json(data);
	});
});
app.get('/api/order/distributions', function(req, res) {
	orders = (req.query.orders) ? JSON.parse(req.query.orders) : null;

	getOrderDistributions(orders, function(err, data) {
		if (err)
			res.status(500).json({ error: err.reason });
		else
			res.json(data);
	});
});
app.get('/api/order/aggregated-distributions', function(req, res) {
	orders = (req.query.orders) ? JSON.parse(req.query.orders) : null;

	getAggregatedOrderDistributions(orders, function(err, data) {
		if (err)
			res.status(500).json({ error: err.reason });
		else
			res.json(data);
	});
});

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});


function getOrderFees(orders, cb) {
	if (!orders || orders.constructor !== Array)
		cb({reason: "Invalid orders input."}, null);

	let amount, totalAmount, orderData = {};

	for (let order of orders) {
		orderData[order.order_number] = { items: [] };
		totalAmount = 0;

		for (let orderItem of order.order_items) {
			amount = 0;

			for (let fee of feesTable.fees[orderItem.type]) {
				switch (fee.type) {
					case 'flat':
						amount += parseFloat(fee.amount);
						break;
					case 'per-page':
						amount += parseFloat(fee.amount) * (orderItem.pages - 1);
						break;
					default:
						break;
				}
			}
			totalAmount += amount;
			orderData[order.order_number]['items'].push({[orderItem.type]: amount.toFixed(2)});
		}
		orderData[order.order_number]['total'] = totalAmount.toFixed(2);
	}
	cb(null, orderData);
}

function getOrderDistributions(orders, cb) {
	if (!orders || orders.constructor !== Array)
		cb({reason: "Invalid orders input."}, null);

	let amount, distAmount, totalDistAmount, otherAmount, orderData = { total_funds: {} };

  	for (let order of orders) {
		orderData[order.order_number] = { funds: [] };

		for (let orderItem of order.order_items) {
			amount = 0;
			distAmount = 0;
			totalDistAmount = 0;

			for (let fee of feesTable.fees[orderItem.type]) {
				switch (fee.type) {
					case 'flat':
						amount += parseFloat(fee.amount);
						break;
					case 'per-page':
						amount += parseFloat(fee.amount) * (orderItem.pages - 1);
						break;
					default:
						break;
				}
			}

			for (let dist of feesTable.distributions[orderItem.type]) {
				distAmount = parseFloat(dist.amount);
				totalDistAmount += distAmount;
				orderData['total_funds'][dist.name] = (!orderData['total_funds'][dist.name]) ? 
					parseFloat(distAmount).toFixed(2) : (parseFloat(orderData['total_funds'][dist.name]) + parseFloat(distAmount)).toFixed(2);
				orderData[order.order_number]['funds'].push({[dist.name]: distAmount.toFixed(2)});
			}

			if (amount > totalDistAmount) {
				otherAmount = amount - totalDistAmount;
				orderData['total_funds']['Other'] = (!orderData['total_funds']['Other']) ? 
					parseFloat(otherAmount).toFixed(2) : (parseFloat(orderData['total_funds']['Other']) + parseFloat(otherAmount)).toFixed(2);
				orderData[order.order_number]['funds'].push({['Other']: otherAmount.toFixed(2)});
			}
		}

	}

	cb(null, orderData);
}

function getAggregatedOrderDistributions(orders, cb) {
	if (!orders || orders.constructor !== Array)
		cb({reason: "Invalid orders input."}, null);

	let distAmount, totalDistAmount, currentDistributions, orderData = { total_funds: {} };

 	for (let order of orders) {
		orderData[order.order_number] = { funds: [] };
		orderAmount = 0;
		totalDistAmount = 0;
		currentDistributions = {};

		for (let orderItem of order.order_items) {
			for (let fee of feesTable.fees[orderItem.type]) {
				switch (fee.type) {
					case 'flat':
						orderAmount += parseFloat(fee.amount);
						break;
					case 'per-page':
						orderAmount += parseFloat(fee.amount) * (orderItem.pages - 1);
						break;
					default:
						break;
				}
			}

			for (let dist of feesTable.distributions[orderItem.type]) {
				distAmount = parseFloat(dist.amount);
				totalDistAmount += distAmount;
				currentDistributions[dist.name] = (!currentDistributions[dist.name]) ? 
					distAmount : currentDistributions[dist.name] + distAmount;
			}
		}

		if (orderAmount > totalDistAmount)
			currentDistributions['Other'] = orderAmount - totalDistAmount;

		for (let dist in currentDistributions) {
			orderData['total_funds'][dist] = (!orderData['total_funds'][dist]) ? 
				 parseFloat(currentDistributions[dist]).toFixed(2) : (parseFloat(orderData['total_funds'][dist]) + parseFloat(currentDistributions[dist])).toFixed(2);
			orderData[order.order_number]['funds'].push({[dist]: currentDistributions[dist].toFixed(2)});
		}

	}

	cb(null, orderData);
}


getOrderFees(orders, function(err, data) {
	for (let orderId in data) {
		console.log(`Order ID: ${orderId}`);

		for (let item of data[orderId].items) {
			for (let type in item)
				console.log(`	Order item ${type}: $${item[type]}`);
		}

		console.log(`\n	Order total: $${data[orderId].total}\n`);
	}
});

getOrderDistributions(orders, function(err, data) {
	for (let orderId in data) {
		if (isNaN(orderId))
			continue;

		console.log(`Order ID: ${orderId}`);

		for (let fund of data[orderId].funds) {
			for (let type in fund)
				console.log(`	Fund - ${type}: $${fund[type]}`);
		}

		console.log(`\n`);
	}

	console.log(`Total distributions:`);
	
	for (let dist in data['total_funds'])
		console.log(`	Fund - ${dist}: $${data['total_funds'][dist]}`);

	console.log(`\n`);
});

getAggregatedOrderDistributions(orders, function(err, data) {
	for (let orderId in data) {
		if (isNaN(orderId))
			continue;

		console.log(`Order ID: ${orderId}`);

		for (let fund of data[orderId].funds) {
			for (let type in fund)
				console.log(`	Fund - ${type}: $${fund[type]}`);
		}

		console.log(`\n`);
	}

	console.log(`Total distributions:`);
	
	for (let dist in data['total_funds'])
		console.log(`	Fund - ${dist}: $${data['total_funds'][dist]}`);

	console.log(`\n`);
});
