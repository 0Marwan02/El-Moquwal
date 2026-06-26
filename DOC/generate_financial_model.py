import csv

output_file = r'C:\Projects\el-moquwal\DOC\El-Moquwal_Financial_Model.csv'

years = [f'Year {i} (202{6+i})' for i in range(1, 11)]

# 2. REVENUES & METRICS
paid_projects = [0, 120, 280, 434, 607, 789, 962, 1135, 1305, 1461]
premium_profs = [0, 60, 160, 248, 347, 451, 550, 649, 746, 835]

rev_commission = [projects * 120000 * 0.02 for projects in paid_projects]
rev_subs = [profs * 199 * 12 for profs in premium_profs]
rev_credits = [0, 20000, 50000, 77500, 108500, 141000, 172000, 202000, 232000, 260000]
rev_materials = [0, 10000, 25000, 38750, 54250, 70500, 86000, 101000, 116000, 130000]
rev_featured = [0, 8000, 22000, 34100, 47700, 62000, 75600, 89200, 102500, 114800]

total_revenues = [sum(x) for x in zip(rev_commission, rev_subs, rev_credits, rev_materials, rev_featured)]

# 3. COSTS
ai_requests = [5000 + (p * 15) for p in paid_projects]
cost_apis = [15000, 25000, 45000, 63000, 81000, 98000, 115000, 132000, 149000, 165000]
cost_salaries = [48000, 120000, 280000, 392000, 509600, 621712, 733620, 843663, 944902, 1039392]
cost_marketing = [36000, 80000, 170000, 238000, 309400, 377468, 445412, 512224, 573690, 631059]
cost_hosting = [0, 12000, 20000, 28000, 36400, 44408, 52401, 60261, 67492, 74241]
cost_payment_gw = [total * 0.025 for total in total_revenues]
cost_admin = [8000, 12000, 18000, 25200, 32760, 39967, 47161, 54235, 60743, 66817]

total_costs = [sum(x) for x in zip(cost_salaries, cost_marketing, cost_hosting, cost_apis, cost_payment_gw, cost_admin)]

# 4. CASH FLOW
net_profit = [r - c for r, c in zip(total_revenues, total_costs)]
cumulative_profit = []
curr = -70000 # Initial Investment
for p in net_profit:
    curr += p
    cumulative_profit.append(curr)

with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    
    # Assumptions
    writer.writerow(['1. ASSUMPTIONS'])
    writer.writerow(['Parameter', 'Value', 'Notes'])
    writer.writerow(['Average Project Value (EGP)', 120000, 'Conservative estimate for finishing a 100m2 apartment'])
    writer.writerow(['Platform Commission Rate (%)', '2%', 'Deducted from the escrow payout'])
    writer.writerow(['Premium Subscription (EGP/month)', 199, 'Monthly fee for premium professionals'])
    writer.writerow(['Credit Pack Price (EGP for 50 credits)', 50, 'Used to submit bids (Blind Bidding)'])
    writer.writerow(['Materials Marketplace Take-Rate (%)', '5%', 'Commission on material sales'])
    writer.writerow(['Payment Gateway Fee (%)', '2.5%', 'Deducted from the platform revenues'])
    writer.writerow(['AI Token Cost (USD per 1K Requests)', 0.5, 'Estimated input/output token cost per estimation (Claude Haiku)'])
    writer.writerow(['AI Tokens Average EGP Cost per Request', 0.025, '0.5 USD * 50 EGP / 1000 = 0.025 EGP'])
    writer.writerow([])
    
    # Revenues
    writer.writerow(['2. REVENUES'] + years)
    writer.writerow(['Commission (2%)'] + rev_commission)
    writer.writerow(['Subscriptions (Premium)'] + rev_subs)
    writer.writerow(['Credit Packs (Bidding)'] + rev_credits)
    writer.writerow(['Materials (5%)'] + rev_materials)
    writer.writerow(['Featured Listings'] + rev_featured)
    writer.writerow(['Total Revenues'] + total_revenues)
    writer.writerow([])
    
    # Costs
    writer.writerow(['3. OPERATIONAL COSTS'] + years)
    writer.writerow(['Salaries & Stipends'] + cost_salaries)
    writer.writerow(['Marketing & Acquisition'] + cost_marketing)
    writer.writerow(['Hosting & Infrastructure'] + cost_hosting)
    writer.writerow(['Software & APIs (AI Tokens, SMS, Email)'] + cost_apis)
    writer.writerow(['Payment Gateway Fees (2.5%)'] + cost_payment_gw)
    writer.writerow(['Admin & Misc'] + cost_admin)
    writer.writerow(['Total Operational Costs'] + total_costs)
    writer.writerow([])
    
    # Cash Flow
    writer.writerow(['4. CASH FLOW & ROI'] + years)
    writer.writerow(['Total Revenues'] + total_revenues)
    writer.writerow(['- Total Operational Costs'] + total_costs)
    writer.writerow(['= Net Profit'] + net_profit)
    writer.writerow(['Cumulative Cash Flow (Inc. 70K Inv.)'] + cumulative_profit)
    writer.writerow([])
    writer.writerow(['Total 10-Year Net Profit:', sum(net_profit)])
    writer.writerow(['Average Annual Net Profit:', sum(net_profit)/10])
    writer.writerow(['Return on Investment (ROI):', f"{(sum(net_profit)/10 / 70000) * 100:.2f}%"])

print('CSV Model Generated!')
