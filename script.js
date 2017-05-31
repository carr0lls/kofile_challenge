var orders = [
  {
    "order_date": "1/11/2015",
    "order_number": "20150111000001",
    "order_items": [
      {
        "order_item_id": 1,
        "type": "Real Property Recording",
        "pages": 3
      },
      {
        "order_item_id": 2,
        "type": "Real Property Recording",
        "pages": 1
      }
    ]
  },
  {
    "order_date": "1/17/2015",
    "order_number": "20150117000001",
    "order_items": [
      {
        "order_item_id": 3,
        "type": "Real Property Recording",
        "pages": 2
      },
      {
        "order_item_id": 4,
        "type": "Real Property Recording",
        "pages": 20
      }
    ]
  },
  {
    "order_date": "1/18/2015",
    "order_number": "20150118000001",
    "order_items": [
      {
        "order_item_id": 5,
        "type": "Real Property Recording",
        "pages": 5
      },
      {
        "order_item_id": 6,
        "type": "Birth Certificate",
        "pages": 1
      }
    ]
  },
  {
    "order_date": "1/23/2015",
    "order_number": "20150123000001",
    "order_items": [
      {
        "order_item_id": 7,
        "type": "Birth Certificate",
        "pages": 1
      },
      {
        "order_item_id": 8,
        "type": "Birth Certificate",
        "pages": 1
      }
    ]
  }
];

	fetch('http://localhost:8000/api/order/fees?orders='+JSON.stringify(orders)).then(function(response) {
		return response.json();
	}).then(function(json) {
		console.log(json);
	});