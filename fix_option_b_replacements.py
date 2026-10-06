
import os
import re

ticket_path = "frontend/src/components/TicketPrinter.tsx"
with open(ticket_path, "r", encoding="utf-8") as f:
    ticket_data = f.read()

if "getCurrencySymbol" not in ticket_data:
    ticket_data = "import { formatCurrency, getCurrencySymbol } from \"../utils/currency\";\n" + ticket_data
    ticket_data = re.sub(
        r"const fmt = \(n: number\) => \{[\s\S]*?\};",
        "const fmt = (n: number) => { return formatCurrency(n, false); };",
        ticket_data
    )
    ticket_data = ticket_data.replace("SUBTOTAL BS:", "SUBTOTAL ${getCurrencySymbol()}:")
    ticket_data = ticket_data.replace("TOTAL BS:", "TOTAL ${getCurrencySymbol()}:")
    ticket_data = ticket_data.replace("CAMBIO BS:", "CAMBIO ${getCurrencySymbol()}:")
    with open(ticket_path, "w", encoding="utf-8") as f:
        f.write(ticket_data)

pos_path = "frontend/src/pages/POSPage.tsx"
with open(pos_path, "r", encoding="utf-8") as f:
    pos_data = f.read()

if "getCurrencySymbol" not in pos_data:
    pos_data = "import { formatCurrency, getCurrencySymbol } from \"../utils/currency\";\n" + pos_data
    pos_data = pos_data.replace("Bs. ${", "${getCurrencySymbol()} ${")
    with open(pos_path, "w", encoding="utf-8") as f:
        f.write(pos_data)

print("Frontend formatting patched.")

