frappe.provide("erpnext.stock");

frappe.ui.form.on("Stock Reconciliation", {
	onload_post_render: function (frm) {
		// remove empty row on load
		if (frm.doc.__islocal) {
			var items = [];
			frm.clear_table("items");
			frm.refresh_field("items");
		}
	},
	refresh: function (frm) {
		if (frm.doc.docstatus < 1) {
			frm.add_custom_button(__("Jewellery Items Group"), function () {
				frm.events.get_jewllery_items(frm);
			});
		}
	},
	get_jewllery_items: function (frm) {
		frappe.prompt([{
					label: "Item Group",
					fieldname: "item_group",
					fieldtype: "Link",
					options: "Item Group",
					reqd: 1
				},
				{
					label: "New Valuation Rate",
					fieldname: "jewel_valuation_rate",
					fieldtype: "Currency",
					reqd: 1
				}
			],
			function (data) {
				frappe.call({
					method: "jewellery_app.api.stock_reconciliation_get_items",
					args: {
						warehouse: 'All Warehouses - ' + frappe.get_abbr(frm.doc.company),
						posting_date: frm.doc.posting_date,
						posting_time: frm.doc.posting_time,
						company: frm.doc.company,
						item_group: data.item_group
					},
					callback: function (r) {

						if (r.message.length == 0) {
							frappe.show_alert({
								message: __("No data found for {0} item group", [data.item_group]),
								indicator: 'yellow'
							}, 4);
						}
						// remove duplicate items from existing child item
						for (var i = 0; i < r.message.length; i++) {
							let new_item_code = r.message[i]['item_code']
							$.each(frm.doc.items, function (i, v) {
								if (v.item_code == new_item_code) {
									frm.get_field("items").grid.grid_rows[i].remove();
								}
							})

						}
						frm.refresh_field("items");
						// add new data
						for (var i = 0; i < r.message.length; i++) {
							var d = frm.add_child("items");
							$.extend(d, r.message[i]);
							if (!d.qty) d.qty = null;
							d.valuation_rate = data.jewel_valuation_rate
						}
						frm.refresh_field("items");
					}
				});
			}, __("Get Items by Items Group"), __("Update"));
	}
});