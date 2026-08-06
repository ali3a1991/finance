import { PageHeader } from "@/components/PageHeader";
import { ShoppingListManager } from "@/components/ShoppingListManager";

export default function ShoppingListPage() {
  return <div className="page-stack"><PageHeader page="shoppingList" /><ShoppingListManager /></div>;
}
