import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Pressable,View} from "react-native";
import {NativeInline,NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";
import {useMobileSalesAuth} from "../auth/useMobileSalesAuth";
import type {SmartOrderProduct,SmartOrderCart,SmartOrderOrder} from "@salesx-ai/api-client";

type Auth=ReturnType<typeof useMobileSalesAuth>;
export function SmartOrderHome({auth}:{auth:Auth}){
 const {colors}=useNativeTheme();const org=auth.activeOrganizationId;const api=auth.apiClient;
 const [products,setProducts]=useState<SmartOrderProduct[]>([]);const [cart,setCart]=useState<SmartOrderCart|null>(null);
 const [orders,setOrders]=useState<SmartOrderOrder[]>([]);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");const [error,setError]=useState("");
 const canRead=auth.canPerformApiAction("smartorder.catalog.products.read");
 const canCart=auth.canPerformApiAction("smartorder.cart.read");
 const canOrders=auth.canPerformApiAction("smartorder.orders.mine.read");
 const refresh=useCallback(async()=>{
  if(!api||!org||auth.status!=="authenticated")return;
  const jobs:Promise<void>[]=[];
  if(canRead)jobs.push(api.listSmartOrderProducts(org,{page:1,pageSize:30}).then(r=>setProducts(r.items)));
  if(canCart)jobs.push(api.getSmartOrderCart(org).then(setCart));
  if(canOrders)jobs.push(api.listMySmartOrderOrders(org,1,20).then(r=>setOrders(r.items)));
  const settled=await Promise.allSettled(jobs);const failed=settled.find(x=>x.status==="rejected");
  if(failed&&failed.status==="rejected")setError(failed.reason instanceof Error?failed.reason.message:"Data SmartOrder gagal dimuat.");
 },[api,org,auth.status,canRead,canCart,canOrders]);
 useEffect(()=>{void refresh();},[refresh]);
 const run=async(fn:()=>Promise<unknown>,message:string)=>{
  setBusy(true);setError("");setNotice("");
  try{await fn();setNotice(message);await refresh();}catch(e){setError(e instanceof Error?e.message:"Permintaan SmartOrder gagal.");}finally{setBusy(false);}
 };
 const add=async(product:SmartOrderProduct,variantId:string)=>{
  if(!api||!org)return;
  await run(()=>api.addSmartOrderCartItem(org,{product_id:product.id,variant_id:variantId,quantity:1}),"SKU masuk keranjang. Harga divalidasi backend.");
 };
 const checkout=async()=>{
  if(!api||!org||!cart?.cart?.id)return;
  await run(async()=>{const draft=await api.createSmartOrderOrder(org,{cart_id:String(cart.cart.id),idempotency_key:"mobile-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)});await api.submitSmartOrderOrder(org,draft.id);},"Order berhasil dikirim untuk approval.");
 };
 if(auth.status!=="authenticated"||!org||!api||!canRead)return null;
 const items=cart?.items??[];
 return <NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
  <NativeStack gap="4">
   <NativeInline gap="2" style={{justifyContent:"space-between",alignItems:"center"}}>
    <NativeStack gap="0"><NativeText variant="caption" color={colors.primary} weight="bold">SMARTORDER</NativeText><NativeText variant="title" weight="bold">Katalog & Pesanan</NativeText></NativeStack>
    <Pressable onPress={()=>void refresh()}><NativeText color={colors.primary}>Refresh</NativeText></Pressable>
   </NativeInline>
   {error!==""&&<NativeText color={colors.textSecondary}>{error}</NativeText>}
   {notice!==""&&<NativeText color={colors.primary}>{notice}</NativeText>}
   <NativeText weight="semibold">Katalog ({products.length})</NativeText>
   {products.map(product=><NativeSurface key={product.id} radius="lg" style={{padding:12,borderWidth:1,borderColor:colors.border}}>
    <NativeStack gap="2"><NativeText weight="semibold">{product.name}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{product.product_code}</NativeText>
     {product.variants.map(variant=><NativeInline key={variant.id} gap="2" style={{justifyContent:"space-between",alignItems:"center"}}>
      <NativeStack gap="0"><NativeText>{variant.name}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{variant.sku}</NativeText></NativeStack>
      <Pressable disabled={busy||!auth.canPerformApiAction("smartorder.cart.item.upsert")} onPress={()=>void add(product,variant.id)} style={{padding:9,borderRadius:9,backgroundColor:colors.primary,opacity:busy?0.5:1}}><NativeText color={colors.surface} weight="semibold">Tambah</NativeText></Pressable>
     </NativeInline>)}
    </NativeStack>
   </NativeSurface>)}
   <NativeInline gap="2" style={{justifyContent:"space-between",alignItems:"center"}}><NativeText weight="semibold">Keranjang ({items.length})</NativeText><NativeText color={colors.textSecondary}>{items.reduce((s,i)=>s+Number((i as Record<string,unknown>).quantity??0),0)} unit</NativeText></NativeInline>
   {items.map((item,i)=><NativeText key={String((item as Record<string,unknown>).id??i)}>{String((item as Record<string,unknown>).product_name??"Produk")} · {String((item as Record<string,unknown>).quantity??0)}</NativeText>)}
   <Pressable disabled={busy||items.length===0||!auth.canPerformApiAction("smartorder.orders.create")} onPress={()=>void checkout()} style={{padding:14,borderRadius:12,backgroundColor:colors.primary,opacity:busy||items.length===0?0.45:1}}><NativeText color={colors.surface} weight="bold">Buat & kirim order</NativeText></Pressable>
   <NativeText weight="semibold">Riwayat pesanan ({orders.length})</NativeText>
   {orders.map(order=><View key={order.id} style={{paddingVertical:8,borderTopWidth:1,borderTopColor:colors.border}}><NativeText weight="semibold">{order.order_number}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{order.status} · {order.currency} {String(order.grand_total)}</NativeText></View>)}
  </NativeStack>
 </NativeSurface>;
}
