frappe.provide("erpnext.stock");

frappe.ui.form.on("Stock Reconciliation", {
    refresh: function(frm) {
		if(frm.doc.docstatus < 1) {
			frm.add_custom_button(__("Items Group"), function() {
				frm.events.get_jewllery_items(frm);
			});
		}
    },
    get_jewllery_items: function(frm) {

		frappe.prompt({label:"Item Group", fieldname: "item_group", fieldtype:"Link", options:"Item Group", reqd: 1,
			"get_query": function() {
				return {
					"filters": {
						"company": frm.doc.company,
					}
				}
			}},
			function(data) {
				frappe.call({
					method:"erpnext.stock.doctype.stock_reconciliation.stock_reconciliation.get_items",
					args: {
						warehouse: data.warehouse,
						posting_date: frm.doc.posting_date,
						posting_time: frm.doc.posting_time,
						company:frm.doc.company
					},
					callback: function(r) {
						var items = [];
						frm.clear_table("items");
						for(var i=0; i< r.message.length; i++) {
							var d = frm.add_child("items");
							$.extend(d, r.message[i]);
							if(!d.qty) d.qty = null;
							if(!d.valuation_rate) d.valuation_rate = null;
						}
						frm.refresh_field("items");
					}
				});
			}
		, __("Get Items"), __("Update"));
	}
});