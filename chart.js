// --------------------------------------
//  Canvas
// --------------------------------------

  const margin = { top: 300, right: 200, bottom: 30, left: 350 };
  const width = 2000;
  const height = 6000;

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  const innerChart = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// --------------------------------------
// Tooltip 
// --------------------------------------

const tooltip = d3.tip()
.attr("class", "tooltip")
.offset([-10, 0])
.html((event, d) => `
  <div class="tooltip-wrapper">
    <div class="tooltip-title">${d.products}</div>
    <div class="tooltip-section">
      <div class="tooltip-label">Requirement</div>
      <div class="tooltip-value">${d.Requirement}</div>
    </div>
    <div class="tooltip-section">
      <div class="tooltip-label">Capability</div>
      <div class="tooltip-value">${d.Capability}</div>
    </div>
  </div>
`);

innerChart.call(tooltip);

// --------------------------------------
// Data loading
// --------------------------------------

//d3.json("data/Account_Sharing_Streaming_Services.json").then(json => {
//d3.json("data/Account_takeover_prevention_banking.json").then(json => {
//d3.json("data/ACH_Fraud_Banking.json").then(json => {
//d3.json("data/ACH_Kiting_Banking.json").then(json => {
//d3.json("data/Age_Estimation.json").then(json => {
//d3.json("data/Age_Verification_eCommerce.json").then(json => {
//d3.json("data/AI_Data_Governance_Banking.json").then(json => {
//d3.json("data/AML_Transaction_Banking.json").then(json => {
//d3.json("data/Anti-Bribery_and_Corruption_Banking.json").then(json => {
//d3.json("data/Chargeback_Fraud_Prevention_eCommerce.json").then(json => {
//d3.json("data/Chargeback_Management_eCommerce.json").then(json => {
//d3.json("data/Commission_Fraud.json").then(json => {
//d3.json("data/Embezzlement_eCommerce.json").then(json => {
//d3.json("data/Fake_Supplier_Fraud.json").then(json => {
d3.json("data/Ghost_Employee.json").then(json => {
//d3.json("data/KYC_Banking.json").then(json => {
//d3.json("data/Sanctions_Screening_Banking.json").then(json => {
//d3.json("data/Workforce_IAM_Banking.json").then(json => {
//d3.json("data/Workforce_IAM.json").then(json => {

  const data = [];
  const header = [];
  const seenRequirements = new Set();
  const productImportanceMap = new Map();

  // Step 1: Compute total importance per product
  json.productRequirements.forEach(req => {
    req.productCapabilities.forEach(cap => {
      cap.products.forEach(product => {
        const current = productImportanceMap.get(product.name) || 0;
        productImportanceMap.set(product.name, current + product.importanceValue);
      });
    });
  });

  // Step 2: Flatten into data + header arrays
  json.productRequirements.forEach(req => {
    const requirementName = req.name;
    let isFirstRequirement = !seenRequirements.has(requirementName);

    req.productCapabilities.forEach(cap => {
      const capabilityId = `Cap${cap.id}`;
      const capabilityName = cap.name;
      const importance = cap.importance;

      cap.products.forEach(product => {
        data.push({
          products: product.name,
          Requirement: requirementName,
          Capability: capabilityName,
          ID: capabilityId,
          Requirement2: "", 
          Requirement3: "", 
          Importance: importance,
          values: product.importanceValue,
          sum: productImportanceMap.get(product.name)
        });
      });

      header.push({
        ID: capabilityId,
        Requirement: requirementName,
        Capability: capabilityName,
        Requirement2: isFirstRequirement ? requirementName : "",
        Requirement3: isFirstRequirement ? capabilityId : "",
        firstCapabilityID: isFirstRequirement ? capabilityId : "",
        Importance: importance
      });

      seenRequirements.add(requirementName);
      isFirstRequirement = false;
    });
  });

  console.log("Header:", header);
  console.log("Data:", data);

  // --------------------------------------
  // Scales
  // --------------------------------------

  const colSpacing = 28;
  const idOrder = [...new Set(data.map(d => d.ID))];
  const x = d3.scaleOrdinal()
   .domain(idOrder)
   .range(idOrder.map((_, i) => i * colSpacing));

  const rowSpacing = 20.4;
  const productOrder = [...new Set(data.map(d => d.products))]
   .sort((a, b) => productImportanceMap.get(b) - productImportanceMap.get(a));
  const y = d3.scaleOrdinal()
    .domain(productOrder)
    .range(productOrder.map((_, i) => i * rowSpacing));

  const Requirement = [...new Set(data.flatMap((d) => d.Requirement))];
  const c = d3.scaleOrdinal(Requirement, ["#51A5F2", "#B1B561", "#F2A0D5", "#4CCAD0", "#AB89DB", "#B78BA9", 
    "#6ABCE5", "#66BFA1", "#C28FFD", "#F2A16E", "#AD9580", "#5E76DD"]);

  const r = d3.scaleSqrt([0, 2, 3, 4], [0, 0, 2.7, 7]);
  const o = d3.scaleLinear([0, 2, 3, 4], [0, 1, 1, 1]);

  // --------------------------------------
  // Axes
  // --------------------------------------

  innerChart
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,0)`)
    .call(
      d3
        .axisBottom()
        .scale(x)
        .tickSize(0)
        .tickFormat(() => "")
    )
    .select(".domain")
    .remove();

  innerChart
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(-300,0)`)
    .call(d3.axisRight().scale(y).tickSize(0))
    .attr("text-anchor", "start")
    .select(".domain")
    .remove();

  innerChart.selectAll(".y-axis text")
    .style("cursor", "pointer")
    .on("mouseover", function(event, product) {
      d3.selectAll("circle")
        .style("opacity", function() {
          return d3.select(this).attr("data-product") === product ? 1 : 0.2;
        });
    })
    .on("mouseout", function() {
      d3.selectAll("circle").style("opacity", null); 
    });

// --------------------------------------
// Drawing header 
// --------------------------------------

const labelY = -85, labelAngle = -50;

  innerChart.selectAll("text.text1")
    .data(header)
    .join("text")
    .attr("class", "text1")
    .attr("x", d => x(d.ID))
    .attr("y", labelY)
    .attr("transform", d => `rotate(${labelAngle}, ${x(d.ID)}, ${labelY})`)
    .text(d => d.Capability);

  // innerChart
  //   .selectAll("text.text2")
  //   .data(header.filter(d => d.Requirement2 !== ""))
  //   .join("text")
  //   .attr("class", "text2")
  //   .attr("x", (d) => x(d.firstCapabilityID) -10) 
  //   .attr("y", -30)
  //   .attr("fill", (d) => c(d.Requirement))
  //   .text((d) => d.Requirement2);

  // innerChart
  //   .selectAll("line.line")
  //   .data(header.filter(d => d.Requirement2 !== ""))
  //   .join("line")
  //   .attr("class", "line")
  //   .attr("x1", (d) => x(d.firstCapabilityID) - 10)
  //   .attr("x2", (d) => x(d.firstCapabilityID) + 10)
  //   .attr("y1", -50)
  //   .attr("y2", -50)
  //   .attr("stroke", (d) => c(d.Requirement));

  innerChart
    .selectAll("circle.circle1")
    .data(header)
    .attr("class", "circle1")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", -70)
    .attr("r", (d) => r(d.Importance))
    .attr("fill", (d) => c(d.Requirement))
    .attr("fill-opacity", (d) => o(d.Importance));

  innerChart
    .selectAll("circle2")
    .data(header)
    .attr("class", "circle.circle2")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", -70)
    .attr("r", 7)
    .attr("stroke", (d) => c(d.Requirement))
    .attr("stroke-width", 1.2)
    .attr("fill", "none");

// --------------------------------------
// Drawing matrix 
// --------------------------------------

  innerChart
    .selectAll("circle.circle3")
    .data(data)
    .attr("class", "circle3")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", (d) => y(d.products))
    .attr("r", 7)
    .attr("stroke", "#F9F4F2")
    .attr("stroke-width", 1.2)
    .attr("fill", "#F9F4F2")
    .attr("opacity", 0.5);

  innerChart
    .selectAll("circle.circle4")
    .data(data)
    .attr("class", "circle4")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", (d) => y(d.products))
    .attr("r", (d) => r(d.values))
    .attr("fill", (d) => c(d.Requirement))
    .attr("opacity", (d) => o(d.values))
    .attr("data-product", d => d.products)
    .on("mouseover", tooltip.show)
    .on("mouseout", tooltip.hide);

  innerChart
    .selectAll("circle.circle5")
    .data(data)
    .attr("class", "circle5")
    .join("circle")
    .attr("cx", (d) => x(d.ID))
    .attr("cy", (d) => y(d.products))
    .attr("r", 7)
    .attr("stroke", (d) => c(d.Requirement))
    .attr("stroke-width", 1.2)
    .attr("fill", "none")
    .attr("opacity", (d) => o(d.values))
    .attr("data-product", d => d.products)
    .on("mouseover", tooltip.show)
    .on("mouseout", tooltip.hide);

});