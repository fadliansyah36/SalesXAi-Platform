import {useCallback,useEffect,useState} from "react";
import {Pressable,View,TextInput,Image} from "react-native";
import {NativeInline,NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";
import {useMobileSalesAuth} from "../auth/useMobileSalesAuth";
import type {SmartOrderProduct,SmartOrderCart,SmartOrderOrder,SmartOrderPartnerOrganization,SmartOrderPartnerOrderSummary} from "@salesx-ai/api-client";

type Auth=ReturnType<typeof useMobileSalesAuth>;
export function SmartOrderHome({auth}:{auth:Auth}){
 const {colors}=useNativeTheme();const org=auth.activeOrganizationId;const api=auth.apiClient;
 const [products,setProducts]=useState<SmartOrderProduct[]>([]);const [cart,setCart]=useState<SmartOrderCart|null>(null);
 const [orders,setOrders]=useState<SmartOrderOrder[]>([]);const [partners,setPartners]=useState<SmartOrderPartnerOrganization[]>([]);const [partnerOrders,setPartnerOrders]=useState<SmartOrderPartnerOrderSummary[]>([]);const [partnerDecisionReason,setPartnerDecisionReason]=useState("");const [selectedCustomer,setSelectedCustomer]=useState("");const [selectedProduct,setSelectedProduct]=useState<SmartOrderProduct|null>(null);const [selectedOrder,setSelectedOrder]=useState<Record<string,unknown>|null>(null);const [promotionCodes,setPromotionCodes]=useState("");const [promotionResult,setPromotionResult]=useState("");const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");const [error,setError]=useState("");
 const canRead=auth.canPerformApiAction("smartorder.catalog.products.read");
 const canCart=auth.canPerformApiAction("smartorder.cart.read");
 const canOrders=auth.canPerformApiAction("smartorder.orders.mine.read");
 const canAssist=auth.canPerformApiAction("smartorder.cart.assisted_customer");
 const canEvents=auth.canPerformApiAction("smartorder.events.read");
 const canPartnerOrders=auth.canPerformApiAction("smartorder.partner_orders.read");
 const canPartnerDecision=auth.canPerformApiAction("smartorder.partner_orders.decision");
 const refresh=useCallback(async()=>{
  if(!api||!org||auth.status!=="authenticated")return;
  const jobs:Promise<void>[]=[];
  if(canRead)jobs.push(api.listSmartOrderProducts(org,{page:1,pageSize:30}).then(r=>setProducts(r.items)));
  if(canCart)jobs.push(api.getSmartOrderCart(org).then(result=>{setCart(result);if(result.cart?.customer_organization_id)setSelectedCustomer(String(result.cart.customer_organization_id));}));
  if(canAssist)jobs.push(api.listSmartOrderPartnerOrganizations(org).then(setPartners));
  if(canOrders)jobs.push(api.listMySmartOrderOrders(org,1,20).then(r=>setOrders(r.items)));
  if(canPartnerOrders)jobs.push(api.listSmartOrderPartnerOrders(org,1,30).then(r=>setPartnerOrders(r.items)));
  const settled=await Promise.allSettled(jobs);const failed=settled.find(x=>x.status==="rejected");
  if(failed&&failed.status==="rejected")setError(failed.reason instanceof Error?failed.reason.message:"Data SmartOrder gagal dimuat.");
 },[api,org,auth.status,canRead,canCart,canOrders,canAssist,canPartnerOrders]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{
  if(!api||!org||auth.status!=="authenticated"||!canEvents)return;
  const realtimeUrl=process.env.EXPO_PUBLIC_SUPABASE_URL??"";
  const publishableKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"";
  const onEvent=()=>void refresh();
  if(realtimeUrl&&publishableKey)return api.subscribeSmartOrderBroadcast(org,realtimeUrl,publishableKey,onEvent);
  return api.subscribeSmartOrderEvents(org,onEvent);
 },[api,org,auth.status,canEvents,refresh]);
 const run=async(fn:()=>Promise<unknown>,message:string)=>{
  setBusy(true);setError("");setNotice("");
  try{await fn();setNotice(message);await refresh();}catch(e){setError(e instanceof Error?e.message:"Permintaan SmartOrder gagal.");}finally{setBusy(false);}
 };
 const add=async(product:SmartOrderProduct,variantId:string)=>{
  if(!api||!org)return;
  await run(async()=>{if(canAssist){if(!selectedCustomer)throw new Error("Pilih customer aktif sebelum membuat order sales-assisted.");await api.setSmartOrderAssistedCustomer(org,selectedCustomer);}await api.addSmartOrderCartItem(org,{product_id:product.id,variant_id:variantId,quantity:1});},"SKU masuk keranjang. Harga divalidasi backend.");
 };
 const updateQuantity=async(item:Record<string,unknown>,delta:number)=>{
  if(!api||!org)return;const quantity=Number(item.quantity??0)+delta;if(quantity<=0)return;
  await run(()=>api.updateSmartOrderCartItem(org,String(item.id),{quantity}),"Kuantitas cart diperbarui.");
 };
 const evaluatePromotions=async()=>{
  if(!api||!org||!cart?.cart?.id)return;
  await run(async()=>{const result=await api.evaluateSmartOrderPromotions(org,String(cart.cart.id),promotionCodes.split(",").map(x=>x.trim()).filter(Boolean));setPromotionResult("Diskon terverifikasi: "+String(result.discount_total??"0"));},"Eligibility promotion dievaluasi oleh FastAPI.");
 };
 const checkout=async()=>{
  if(!api||!org||!cart?.cart?.id)return;
  await run(async()=>{if(canAssist){if(!selectedCustomer)throw new Error("Pilih customer aktif sebelum checkout.");await api.setSmartOrderAssistedCustomer(org,selectedCustomer);}const draft=await api.createSmartOrderOrder(org,{cart_id:String(cart.cart.id),idempotency_key:"mobile-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2),promotion_codes:promotionCodes.split(",").map(x=>x.trim()).filter(Boolean)});await api.submitSmartOrderOrder(org,draft.id);},"Order berhasil dikirim untuk approval.");
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
   {canAssist&&<NativeSurface radius="lg" style={{padding:12,borderWidth:1,borderColor:colors.border}}><NativeText weight="semibold">Customer order</NativeText><NativeText variant="caption" color={colors.textSecondary}>Pilih customer terhubung untuk menghitung harga dan membuat order atas nama customer.</NativeText><NativeInline gap="2" style={{flexWrap:"wrap"}}>{partners.map(partner=><Pressable key={partner.id} onPress={()=>{setSelectedCustomer(partner.id);if(api&&org)void run(()=>api.setSmartOrderAssistedCustomer(org,partner.id),"Customer dipilih untuk cart sales-assisted.");}} style={{padding:9,borderRadius:10,borderWidth:1,borderColor:selectedCustomer===partner.id?colors.primary:colors.border}}><NativeText weight={selectedCustomer===partner.id?"bold":"regular"}>{partner.name}</NativeText></Pressable>)}</NativeInline>{partners.length===0&&<NativeText variant="caption" color={colors.textSecondary}>Belum ada relasi customer aktif.</NativeText>}</NativeSurface>}
   <NativeText weight="semibold">Katalog ({products.length})</NativeText>
   {products.map(product=><NativeSurface key={product.id} radius="lg" style={{padding:12,borderWidth:1,borderColor:colors.border}}>
    <NativeStack gap="2">{product.images?.[0]?.signed_url&&<Image source={{uri:product.images[0].signed_url}} resizeMode="cover" style={{width:"100%",height:150,borderRadius:10}}/>}<Pressable onPress={()=>void run(()=>api.getSmartOrderProduct(org,product.id).then(setSelectedProduct),"Detail produk dimuat.")}><NativeText weight="semibold">{product.name}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{product.product_code} · Lihat detail</NativeText></Pressable>
     {product.variants.map(variant=><NativeInline key={variant.id} gap="2" style={{justifyContent:"space-between",alignItems:"center"}}>
      <NativeStack gap="0"><NativeText>{variant.name}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{variant.sku}</NativeText></NativeStack>
      <Pressable disabled={busy||!auth.canPerformApiAction("smartorder.cart.item.upsert")||(canAssist&&!selectedCustomer)} onPress={()=>void add(product,variant.id)} style={{padding:9,borderRadius:9,backgroundColor:colors.primary,opacity:busy?0.5:1}}><NativeText color={colors.surface} weight="semibold">Tambah</NativeText></Pressable>
     </NativeInline>)}
    </NativeStack>
   </NativeSurface>)}
   {selectedProduct&&<NativeSurface radius="lg" style={{padding:12,borderWidth:1,borderColor:colors.border}}><NativeInline style={{justifyContent:"space-between",alignItems:"center"}}><NativeText weight="semibold">Detail produk</NativeText><Pressable onPress={()=>setSelectedProduct(null)}><NativeText color={colors.primary}>Tutup</NativeText></Pressable></NativeInline><NativeText>{selectedProduct.name} · {selectedProduct.product_code}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{selectedProduct.description??"Tidak ada deskripsi produk."}</NativeText>{selectedProduct.images?.map(image=> <Image key={image.id} source={{uri:image.signed_url}} resizeMode="cover" style={{width:"100%",height:180,borderRadius:10}}/>)}{selectedProduct.variants.map(v=><NativeText key={v.id} variant="caption" color={colors.textSecondary}>{v.sku} · {v.name}</NativeText>)}</NativeSurface>}
   <NativeInline gap="2" style={{justifyContent:"space-between",alignItems:"center"}}><NativeText weight="semibold">Keranjang ({items.length})</NativeText><NativeText color={colors.textSecondary}>{items.reduce((s,i)=>s+Number((i as Record<string,unknown>).quantity??0),0)} unit</NativeText></NativeInline>
   {items.map((item,i)=>{const row=item as Record<string,unknown>;return <NativeInline key={String(row.id??i)} gap="2" style={{justifyContent:"space-between",alignItems:"center"}}><NativeStack gap="0"><NativeText>{String(row.product_name??"Produk")}</NativeText><NativeText variant="caption" color={colors.textSecondary}>Qty {String(row.quantity??0)} · {String(row.sku??"")}</NativeText></NativeStack><NativeInline gap="2"><Pressable disabled={busy||Number(row.quantity)<=1} onPress={()=>void updateQuantity(row,-1)}><NativeText color={colors.primary}>−</NativeText></Pressable><Pressable disabled={busy} onPress={()=>void updateQuantity(row,1)}><NativeText color={colors.primary}>+</NativeText></Pressable><Pressable disabled={busy} onPress={()=>void run(()=>api.removeSmartOrderCartItem(org,String(row.id)),"Item dihapus.")}><NativeText color={colors.textSecondary}>Hapus</NativeText></Pressable></NativeInline></NativeInline>;})}
   <NativeInline gap="2"><TextInput value={promotionCodes} onChangeText={setPromotionCodes} placeholder="Kode voucher" placeholderTextColor={colors.textMuted} style={{flex:1,padding:10,borderWidth:1,borderColor:colors.border,borderRadius:10,color:colors.textPrimary}}/><Pressable disabled={busy||!promotionCodes.trim()} onPress={()=>void evaluatePromotions()}><NativeText color={colors.primary}>Evaluasi</NativeText></Pressable></NativeInline>{promotionResult!==""&&<NativeText variant="caption" color={colors.textSecondary}>{promotionResult}</NativeText>}
   <Pressable disabled={busy||items.length===0||!auth.canPerformApiAction("smartorder.orders.create")} onPress={()=>void checkout()} style={{padding:14,borderRadius:12,backgroundColor:colors.primary,opacity:busy||items.length===0?0.45:1}}><NativeText color={colors.surface} weight="bold">Buat & kirim order</NativeText></Pressable>
   <NativeText weight="semibold">Riwayat pesanan ({orders.length})</NativeText>
   {canPartnerOrders&&<NativeSurface radius="lg" style={{padding:12,borderWidth:1,borderColor:colors.border}}><NativeText weight="semibold">Approval Principal / Distributor ({partnerOrders.length})</NativeText>{partnerOrders.map(order=><View key={order.id} style={{paddingVertical:10,borderTopWidth:1,borderTopColor:colors.border}}><NativeText weight="semibold">{order.order_number}</NativeText><NativeText variant="caption" color={colors.textSecondary}>Buyer {order.buyer_organization_id.slice(0,8)} · {order.status} · {order.partner_item_count} item</NativeText>{canPartnerDecision&&order.status==="pending_approval"&&<NativeStack gap="2"><TextInput value={partnerDecisionReason} onChangeText={setPartnerDecisionReason} placeholder="Alasan penolakan/revisi (wajib untuk opsi tersebut)" placeholderTextColor={colors.textMuted} style={{padding:9,borderWidth:1,borderColor:colors.border,borderRadius:9,color:colors.textPrimary}}/><NativeInline gap="2"><Pressable disabled={busy} onPress={()=>void run(()=>api.decideSmartOrderPartnerOrder(org,order.id,{decision:"accepted",idempotency_key:"expo-"+Date.now()+"-"+Math.random().toString(36).slice(2)}),"Partner menerima order.")} style={{padding:9,borderRadius:8,backgroundColor:colors.primary}}><NativeText color={colors.surface} weight="semibold">Terima</NativeText></Pressable><Pressable disabled={busy||partnerDecisionReason.trim().length<3} onPress={()=>void run(()=>api.decideSmartOrderPartnerOrder(org,order.id,{decision:"rejected",reason:partnerDecisionReason.trim(),idempotency_key:"expo-"+Date.now()+"-"+Math.random().toString(36).slice(2)}).then(()=>setPartnerDecisionReason("")),"Partner menolak order dan reservation dilepas.")} style={{padding:9,borderRadius:8,borderWidth:1,borderColor:colors.border}}><NativeText color={colors.textPrimary}>Tolak</NativeText></Pressable><Pressable disabled={busy||partnerDecisionReason.trim().length<3} onPress={()=>void run(()=>api.decideSmartOrderPartnerOrder(org,order.id,{decision:"revision_requested",reason:partnerDecisionReason.trim(),idempotency_key:"expo-"+Date.now()+"-"+Math.random().toString(36).slice(2)}).then(()=>setPartnerDecisionReason("")),"Partner meminta revisi dan reservation dilepas.")} style={{padding:9,borderRadius:8,borderWidth:1,borderColor:colors.border}}><NativeText color={colors.textPrimary}>Minta revisi</NativeText></Pressable></NativeInline></NativeStack>}</View>)}</NativeSurface>}
   {orders.map(order=><View key={order.id} style={{paddingVertical:8,borderTopWidth:1,borderTopColor:colors.border}}><NativeText weight="semibold">{order.order_number}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{order.status} · {order.currency} {String(order.grand_total)}</NativeText><Pressable disabled={busy} onPress={()=>void run(()=>api.getSmartOrderOrder(org,order.id).then(order=>setSelectedOrder(order as unknown as Record<string,unknown>)),"Timeline pesanan dimuat.")}><NativeText color={colors.primary} variant="caption">Lihat tracking & riwayat</NativeText></Pressable></View>)}
   {selectedOrder&&<NativeSurface radius="lg" style={{padding:12,borderWidth:1,borderColor:colors.border}}><NativeInline style={{justifyContent:"space-between",alignItems:"center"}}><NativeText weight="semibold">Tracking {String(selectedOrder.order_number??"")}</NativeText><Pressable onPress={()=>setSelectedOrder(null)}><NativeText color={colors.primary}>Tutup</NativeText></Pressable></NativeInline><NativeText>Status: {String(selectedOrder.status??"")}</NativeText>{Array.isArray(selectedOrder.history)&&selectedOrder.history.map((event,i)=><NativeText key={String((event as Record<string,unknown>).id??i)} variant="caption" color={colors.textSecondary}>{String((event as Record<string,unknown>).from_status??"—")} → {String((event as Record<string,unknown>).to_status??"")} · {String((event as Record<string,unknown>).occurred_at??"")}</NativeText>)}{Array.isArray(selectedOrder.fulfillments)&&selectedOrder.fulfillments.map((f,i)=><NativeText key={String((f as Record<string,unknown>).id??i)} variant="caption" color={colors.textSecondary}>Fulfillment: {String((f as Record<string,unknown>).status??"")} · Tracking {String((f as Record<string,unknown>).tracking_number??"menunggu nomor resi")}</NativeText>)}</NativeSurface>}
  </NativeStack>
 </NativeSurface>;
}
