import frappe
from frappe import _
from erpnext.stock.utils import get_stock_balance

@frappe.whitelist()
def stock_reconciliation_get_items(posting_date, posting_time, company,item_group):
    res = []
    warehouses=frappe.db.sql("""select name from `tabWarehouse` where is_group=1 and (parent_warehouse ='' or parent_warehouse is null) and company=%s""",company)
    if warehouses is not None : 
        for warehouse in warehouses:
            warehouse=warehouse[0][0]

            lft, rgt = frappe.db.get_value("Warehouse", warehouse, ["lft", "rgt"])
            iglft,igrgt = frappe.db.get_value("Item Group", item_group, ["lft", "rgt"])

            items = frappe.db.sql("""
                select i.name, i.item_name, bin.warehouse,i.item_group
                from tabBin bin, tabItem i
                where i.name=bin.item_code and i.disabled=0 and i.is_stock_item = 1
                and i.has_variants = 0 and i.has_serial_no = 0 and i.has_batch_no = 0
                and exists(select name from `tabWarehouse` where lft >= %s and rgt <= %s and name=bin.warehouse)
                and exists(select name from `tabItem Group` where lft >= %s and rgt <= %s and name=i.item_group)
            """, (lft, rgt,iglft,igrgt))

            items += frappe.db.sql("""
                select i.name, i.item_name, id.default_warehouse,i.item_group
                from tabItem i, `tabItem Default` id
                where i.name = id.parent
                    and exists(select name from `tabWarehouse` where lft >= %s and rgt <= %s and name=id.default_warehouse)
                    and i.is_stock_item = 1 and i.has_serial_no = 0 and i.has_batch_no = 0
                    and i.has_variants = 0 and i.disabled = 0 and id.company=%s
                    and exists(select name from `tabItem Group` where lft >= %s and rgt <= %s and name=i.item_group)
                group by i.name
            """, (lft, rgt, company,iglft,igrgt))

            
            for d in set(items):
                stock_bal = get_stock_balance(d[0], d[2], posting_date, posting_time,
                    with_valuation_rate=True)

                if frappe.db.get_value("Item", d[0], "disabled") == 0:
                    if stock_bal[0]>0:
                        res.append({
                            "item_code": d[0],
                            "warehouse": d[2],
                            "qty": stock_bal[0],
                            "item_name": d[1],
                            "valuation_rate": stock_bal[1],
                            "current_qty": stock_bal[0],
                            "current_valuation_rate": stock_bal[1]
                        })

        return res