frappe.provide("erpnext.stock");

frappe.ui.form.on("Stock Reconciliation", {
    refresh: function(frm) {
		if(frm.doc.docstatus < 1) {
			frm.add_custom_button(__("Jewellery Items Group"), function() {
				frm.events.get_jewllery_items(frm);
			});
		}
    },
    get_jewllery_items: function(frm) {

		frappe.prompt([
			{label:"Item Group", fieldname: "item_group", fieldtype:"Link", options:"Item Group", reqd: 1},
			{label:"New Valuation Rate", fieldname: "jewel_valuation_rate", fieldtype:"Currency", reqd: 1}		
		],
			function(data) {
				frappe.call({
					method:"jewellery_app.api.stock_reconciliation_get_items",
					args: {
						warehouse: 'All Warehouses - '+frappe.get_abbr(frm.doc.company),
						posting_date: frm.doc.posting_date,
						posting_time: frm.doc.posting_time,
						company:frm.doc.company,
						item_group:data.item_group
					},
					callback: function(r) {
						var items = [];
						frm.clear_table("items");
						for(var i=0; i< r.message.length; i++) {
							var d = frm.add_child("items");
							$.extend(d, r.message[i]);
							if(!d.qty) d.qty = null;
							d.valuation_rate =data.jewel_valuation_rate
							// if(!d.valuation_rate) d.valuation_rate = null;
						}
						frm.refresh_field("items");
					}
				});
			}
		, __("Get Items by Items Group"), __("Update"));
	}
});