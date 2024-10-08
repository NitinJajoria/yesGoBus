import { useEffect, useState } from "react";
import "./BusBooking.scss";
import {
	Navbar,
	BusRoute,
	LeftFilter,
	//OffersCard,
	//Title,
	RoutesTitle,
	ColumnNames,
	BusBookingCard,
	//Footer,
} from "../../components";
import { formatDate } from "../../utils/BusBookingHelpers";
import { useNavigate } from "react-router-dom";
// import {
//   fromto
// } from "../../assets/homepage";
// import { offer1 } from "../../assets/homepage";
//import axiosInstance from "../../utils/service";

import { Spin } from "antd";
import { useLocation, Navigate } from "react-router-dom";
import { cityMapping } from "../../utils/cityMapping";
import { filterIcon } from "../../assets/busbooking";
import { leftArrow } from "../../assets/busbooking";
import { getVrlBuses } from "../../api/vrlBusesApis";
import { getSrsBuses } from "../../api/srsBusesApis";
import BusSortBy from "../../components/BusSortBy/BusSortBy";
import {
	getBusBookingCardProps,
	sortBuses,
} from "../../utils/BusBookingHelpers";

const BusBooking = () => {
	const navigate = useNavigate();
	const loggedInUser = localStorage.getItem("loggedInUser");

	const location = useLocation();
	const [noOfBuses, setNoOfBuses] = useState(0);
	const [noOfVrlBuses, setNoVrlOfBuses] = useState(0);
	const [noOfSrsBuses, setNoSrsOfBuses] = useState(0);
	const [busDetails, setBusDetails] = useState([]);
	const [loading, setLoading] = useState(false);

	const [vrlBuses, setVrlBuses] = useState([]);
	const [srsBuses, setSrsBuses] = useState([]);
	const [srsBusesForFilter, setSrsBusesForFilter] = useState([]);
	const [allSrsBusOperators, setSrsBusOperators] = useState([]);

	// SortState
	const [sortBy, setSortBy] = useState(null);

	//dates
	const queryParams = new URLSearchParams(location.search);
	const dateString = queryParams.get("date");
	const dates = [];

	for (let i = 1; i <= 7; i++) {
		const nextDate = new Date(dateString);
		nextDate.setDate(nextDate.getDate() + i);
		dates.push(formatDate(nextDate));
	}

	let currentDate = new Date();
	const year = currentDate.getFullYear();
	const month = String(currentDate.getMonth() + 1).padStart(2, "0");
	const day = String(currentDate.getDate()).padStart(2, "0");
	currentDate = `${year}-${month}-${day}`;

	const sourceCity =
		queryParams.get("from") || localStorage.getItem("sourceCity");
	const destinationCity =
		queryParams.get("to") || localStorage.getItem("destinationCity");
	// const doj =
	// queryParams.get("date") || localStorage.getItem("doj");
	const storedDoj = localStorage.getItem("doj");
	const queryDate = queryParams.get("date");
	if (queryDate || storedDoj) {
		if (queryDate >= currentDate) {
			currentDate = queryDate;
		} else if (storedDoj >= currentDate) {
			currentDate = storedDoj;
		}
	}
	// currentDate = queryParams.get("date") || currentDate;

	const [fromLocation, setFromLocation] = useState(sourceCity);
	const [toLocation, setToLocation] = useState(destinationCity);
	const [selectedDate, setSelectedDate] = useState(currentDate);

	// const [sourceCityId, setSourceCityId] = useState("");
	// const [destinationCityId, setDestinationCityId] = useState("");

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const sourceCity = queryParams.get("from");
		const destinationCity = queryParams.get("to");
		let currentDate = new Date();
		const year = currentDate.getFullYear();
		const month = String(currentDate.getMonth() + 1).padStart(2, "0");
		const day = String(currentDate.getDate()).padStart(2, "0");
		currentDate = `${year}-${month}-${day}`;
		let doj = currentDate;
		const storedDoj = localStorage.getItem("doj");
		const queryDate = queryParams.get("date");
		if (queryDate || storedDoj) {
			const queryDateObj = new Date(queryDate);
			const storedDojObj = new Date(storedDoj);
			const currDate = new Date();
			if (queryDateObj > currDate) {
				doj = queryDate;
			} else if (storedDojObj > currDate) {
				doj = storedDoj;
			}
		}
		if (sourceCity && destinationCity) {
			setFromLocation(sourceCity);
			setToLocation(destinationCity);
			setSelectedDate(doj);
		}
		handleSearch(fromLocation, toLocation, selectedDate);
	}, [location]);

	const handleSearch = async (
		sourceCity,
		destinationCity,
		doj,
		filters,
		returnDate
	) => {
		setBusDetails([]);
		setVrlBuses([]);
		setSrsBuses([]);
		if (
			sourceCity === null ||
			sourceCity === undefined ||
			sourceCity === "" ||
			sourceCity === "null"
		) {
			sourceCity = "Mysore";
		}
		if (
			destinationCity === null ||
			destinationCity === undefined ||
			destinationCity === "" ||
			destinationCity === "null"
		) {
			destinationCity = "Bangalore";
		}

		if (
			sourceCity.trim().toLowerCase() === destinationCity.trim().toLowerCase()
		) {
			alert("Source and destination cities cannot be the same.");
			return;
		}
		localStorage.setItem("sourceCity", sourceCity);
		localStorage.setItem("destinationCity", destinationCity);
		localStorage.setItem("doj", doj);
		setFromLocation(sourceCity);
		setToLocation(destinationCity);
		setSelectedDate(doj);
		setNoOfBuses(0);
		setNoVrlOfBuses(0);
		setNoSrsOfBuses(0);

		let sourceCities = [];
		let destinationCities = [];
		if (sourceCity.trim().toLowerCase() in cityMapping) {
			const mapping = cityMapping[sourceCity.trim().toLowerCase()];
			sourceCities = mapping.sourceCity;
		} else {
			sourceCities.push(sourceCity);
		}
		if (destinationCity.trim().toLowerCase() in cityMapping) {
			const mapping = cityMapping[destinationCity.trim().toLowerCase()];
			destinationCities = mapping.sourceCity;
		} else {
			destinationCities.push(destinationCity);
		}
		let isFilter = false;

		if (
			filters &&
			(filters.busPartners.length > 0 ||
				filters.boardingPoints.length > 0 ||
				filters.droppingPoints.length > 0 ||
				filters.busType.length > 0 ||
				(filters.minPrice && filters.maxPrice))
		) {
			isFilter = true;
			let filteredBuses = srsBusesForFilter;
			if (filters.busPartners.length > 0) {
				filteredBuses = filteredBuses.filter((bus) =>
					filters?.busPartners
						.map((partner) => partner.toLowerCase())
						.includes(bus?.operator_service_name.toLowerCase())
				);
			}
			if (filters.boardingPoints.length > 0) {
				filteredBuses = filteredBuses.filter((bus) =>
					filters.boardingPoints.some((point) =>
						bus.boarding_stages.includes(point)
					)
				);
			}
			if (filters.droppingPoints.length > 0) {
				filteredBuses = filteredBuses.filter((bus) =>
					filters.droppingPoints.some((point) =>
						bus.dropoff_stages.includes(point)
					)
				);
			}

			// WORKING FOR ALL EXCEPT NON-AC BUSES
			// if (filters.busType.length > 0) {
			// 	const filterCriteria = filters.busType.map((type) =>
			// 		type.split(/[;,]/).map((subType) => new RegExp(subType, "i"))
			// 	);
			// 	filteredBuses = filteredBuses.filter((bus) => {
			// 		const busType = bus.bus_type;
			// 		return filterCriteria.every((criteria) =>
			// 			criteria.every((subCriteria) => subCriteria.test(busType))
			// 		);
			// 	});
			// 	console.log("filteredBuses with filter", filteredBuses);
			// }
			if (filters.busType.length > 0 && filters.busType.length !== 4) {
				const filterCriteria = filters.busType.map((type) => {
					if (type.toLowerCase() === "non ac") {
						return [new RegExp("^(?!.*ac).*$", "i")]; // matches any string that does not contain 'ac'
					} else {
						return type
							.split(/[;,]/)
							.map((subType) => new RegExp(subType, "i"));
					}
				});
				const originalBuses = [...filteredBuses]; // store the original buses array
				filteredBuses = filteredBuses.filter((bus) => {
					const busType = bus.bus_type;
					return filterCriteria.every((criteria) =>
						criteria.every((subCriteria) => subCriteria.test(busType))
					);
				});
				if (
					filteredBuses.length === 0 &&
					filters.busType.some((type) => type.toLowerCase() === "non ac")
				) {
					filteredBuses = originalBuses; // return all buses if no Non-AC buses are found
				}
				console.log("filteredBuses with filter", filteredBuses);
			}

			// if (filters.minPrice && filters.maxPrice) {
			// 	setVrlBuses([]);
			// 	setNoVrlOfBuses(0);
			// 	filteredBuses = filteredBuses.filter((bus) => {
			// 		const prices = bus.show_fare_screen
			// 			.split("/")
			// 			.map((price) => parseFloat(price));
			// 		return prices.some(
			// 			(price) => price >= filters.minPrice && price <= filters.maxPrice
			// 		);
			// 	});
			// }
			if (filters.minPrice && filters.maxPrice) {
				setVrlBuses([]);
				setNoVrlOfBuses(0);
				filteredBuses = filteredBuses.filter((bus) => {
					const prices = bus.show_fare_screen
						.split("/")
						.map((price) => parseFloat(price));
					return prices.every(
						(price) => price >= filters.minPrice && price <= filters.maxPrice
					);
				});
				// console.log("filteredBuses with filter price", filteredBuses);
			}
			const uniqueBusesSet = new Set(filteredBuses.map((bus) => bus.id));
			filteredBuses = Array.from(uniqueBusesSet, (id) =>
				filteredBuses.find((bus) => bus.id === id)
			);

			setSrsBuses(filteredBuses);
			setNoSrsOfBuses(filteredBuses?.length);
		} else {
			isFilter = false;
		}
		//vrl buses
		for (const sourceCity of sourceCities) {
			for (const destinationCity of destinationCities) {
				try {
					setLoading(true);
					const requestBody = {
						sourceCity: sourceCity.trim(),
						destinationCity: destinationCity.trim(),
						doj: doj,
						...filters,
					};
					const vrlResponse = await getVrlBuses(requestBody);
					if (Array.isArray(vrlResponse.data)) {
						const uniqueReferenceNumbersSet = new Set();
						const uniqueBusesArray = vrlResponse.data.filter((bus) => {
							if (!uniqueReferenceNumbersSet.has(bus.ReferenceNumber)) {
								uniqueReferenceNumbersSet.add(bus.ReferenceNumber);
								return true;
							}
							return false;
						});

						setVrlBuses((prevBuses) => {
							// extract a unique list of buses from combined bus list
							let newBuslist = [...prevBuses, ...uniqueBusesArray];
							const newUniqueBusListSet = new Set();
							const newUniqueBusList = newBuslist.filter((bus) => {
								if (!newUniqueBusListSet.has(bus.ReferenceNumber)) {
									newUniqueBusListSet.add(bus.ReferenceNumber);
									return true;
								}
								return false;
							});

							return [...newUniqueBusList];
						});
						setNoVrlOfBuses((prevCount) => prevCount + uniqueBusesArray.length);
					} else {
						console.error("Invalid vrlResponse.data:", vrlResponse.data);
					}
					// setVrlDestinationCityId(vrlResponse.destinationCity);
					// setVrlSourceCityId(vrlResponse.sourceCity);
				} catch (error) {
					// setVrlBuses([]);
					// setNoVrlOfBuses(0);
					// console.log(error);
				}

				//srs buses
				try {
					if (isFilter === false) {
						const srsResponse = await getSrsBuses(
							sourceCity.trim(),
							destinationCity.trim(),
							doj
						);
						const filteredBuses = srsResponse.filter(
							(bus) => bus?.status === "New" || bus.status === "Update"
						);
						setSrsBuses((prevBuses) => [...prevBuses, ...filteredBuses]);
						setSrsBusesForFilter((prevFilteredBuses) => [
							...prevFilteredBuses,
							...filteredBuses,
						]);
						setNoSrsOfBuses((prevCount) => prevCount + filteredBuses?.length);
					}
				} catch (error) {
					//   setSrsBuses([]);
					// setSrsBusesForFilter([]);
					// setNoSrsOfBuses(0);
					// console.log(error);
				}

				//seat seller buses
			}
		}
		try {
			// const response = await axiosInstance.post(
			//   `${import.meta.env.VITE_BASE_URL}/api/busBooking/getBusDetails`,
			//   {
			//     sourceCity: sourceCity.trim(),
			//     destinationCity: destinationCity.trim(),
			//     doj: doj,
			//     ...filters,
			//   }
			// );
			// if (response?.data?.data?.length !== 0) {
			//   setBusDetails(response?.data?.data);
			//   setNoOfBuses(response?.data?.data?.length);
			// }
			// setLoading(false);
		} catch (error) {
			// setBusDetails([]);
			// setNoOfBuses(0);
			// setLoading(false);
		} finally {
			setLoading(false);
		}
	};

	const handleDateFilter = (date) => {
		// const monthMap = {
		// 	Jan: 0,
		// 	Feb: 1,
		// 	Mar: 2,
		// 	Apr: 3,
		// 	May: 4,
		// 	Jun: 5,
		// 	Jul: 6,
		// 	Aug: 7,
		// 	Sep: 8,
		// 	Oct: 9,
		// 	Nov: 10,
		// 	Dec: 11,
		// };
		// const parts = date.split(",");
		// const dateParts = parts[1].split("-");
		// const day = parseInt(dateParts[1]);
		// const month = monthMap[dateParts[0]];
		// const year = parseInt(new Date().getFullYear());
		// const newDate = new Date(Date.UTC(year, month, day));
		// const formattedDateString = newDate.toISOString().split("T")[0];
		let formattedDate;
		if (/^\w+, \d{1,2}-\w+$/.test(date)) {
			const [dayOfWeek, dayMonth] = date.split(", ");
			const [dayOfMonth, monthName] = dayMonth.split("-");
			const months = [
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"May",
				"Jun",
				"Jul",
				"Aug",
				"Sep",
				"Oct",
				"Nov",
				"Dec",
			];
			const monthIndex = months.indexOf(monthName) + 1;
			const year = new Date().getFullYear();
			formattedDate = `${year}-${monthIndex
				.toString()
				.padStart(2, "0")}-${dayOfMonth.padStart(2, "0")}`;
		} else {
			const [day, month, year] = date.split("-");
			formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
				2,
				"0"
			)}`;
		}
		handleSearch(fromLocation, toLocation, formattedDate);
	};

	const priceToDisplay = (fare) => {
		const fareArray = Array.isArray(fare) ? fare : [fare];
		const basePricesArray = fareArray.map((details) =>
			parseFloat(details.baseFare)
		);
		const minPrice = Math.min(...basePricesArray).toFixed(2);
		return minPrice;
	};

	// const priceToDisplaySrs = (fare) => {
	//   const prices = fare.split("/");
	//   if (prices.length === 1) {
	//     return prices[0];
	//   } else {
	//     const minPrice = Math.min(...prices).toFixed(2);
	//     return minPrice;
	//   }
	// };

	// const formatTravelTime = (durationInMins) => {
	//   const hours = Math.floor(durationInMins / 60);
	//   const minutes = durationInMins % 60;
	//   const formattedHours = hours > 0 ? `${hours} :` : "";
	//   const formattedMinutes = minutes > 0 ? ` ${minutes}` : "";
	//   return `${formattedHours}${formattedMinutes}`;
	// };

	const handleFilter = (filters) => {
		handleSearch(fromLocation, toLocation, selectedDate, filters);
	};

	const handleDate = (date) => {
		handleSearch(fromLocation, toLocation, date);
	};

	const [showMobileFilters, setShowMobileFilters] = useState(false);

	function convertMinutesToTime(minutes) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		const journeyDay = Math.floor(hours / 24);
		const hour = hours % 24;
		const ampm = hour < 12 ? "am" : "pm";
		const displayHour = hour > 12 ? hour - 12 : hour;
		const formattedTime = `${displayHour.toString().padStart(2, "0")}:${mins
			.toString()
			.padStart(2, "0")} ${ampm}`;
		return formattedTime;
	}

	function calculateTravelTime(departureTime, arrivalTime) {
		if (arrivalTime < departureTime) {
			arrivalTime += 1440;
		}
		const travelTimeInMinutes = arrivalTime - departureTime;
		const travelHours = Math.floor(travelTimeInMinutes / 60);
		const travelMinutes = travelTimeInMinutes % 60;
		const totalTimeTaken = travelHours + "hr " + travelMinutes + "min";
		return totalTimeTaken;
	}

	// function calculateVrlTravelTime(pickupTime, arrivalTime) {
	//   const currentDate = new Date();

	//   const [hours, minutes, seconds] = pickupTime.split(":");
	//   currentDate.setHours(hours);
	//   currentDate.setMinutes(minutes);
	//   currentDate.setSeconds(seconds || 0);

	//   const arrivalDateTime = new Date(
	//     arrivalTime.replace(
	//       /(\d+)-(\d+)-(\d+) (\d+):(\d+) ([APMapm]{2})/,
	//       "$2/$1/$3 $4:$5 $6"
	//     )
	//   );
	//   const timeDifference = arrivalDateTime - currentDate;

	//   const travelTimeInMinutes = timeDifference / (1000 * 60);
	//   return formatTravelTime(parseInt(travelTimeInMinutes));
	// }

	// Handle sort change
	function handleSortByChange(sortTerm) {
		setSortBy(sortTerm);
	}

	// get sortedData
	const busList = [...vrlBuses, ...srsBuses]; // vrlbuses always go first
	const sortedBusList = sortBuses(busList, sortBy);

	// Check if user is logged in
	if (!loggedInUser) {
		return <Navigate to="/login" replace />;
	}

	console.log(sortedBusList);
	return (
		<div className="busBooking">
			{/* <Navbar /> */}
			{/* <BusRoute
				locationOne={fromLocation}
				locationTwo={toLocation}
				departureDate={selectedDate}
				returnDate={"- - -"}
				onSearch={handleSearch}
			/> */}

			<div className="busBooking-container">
				<div className="left">
					<LeftFilter
						sourceCity={fromLocation}
						destinationCity={toLocation}
						doj={selectedDate}
						onFilterChange={handleFilter}
						isSrs={noOfSrsBuses > 0}
						allSrsBusOperators={allSrsBusOperators}
						key={"left-filter"}
					/>
				</div>

				<div className="right">
					<div className="mobile-filter">
						<div className="filter-buttons">
							<button
								className="filter"
								onClick={() => setShowMobileFilters(!showMobileFilters)}
							>
								<img src={filterIcon} alt="" /> <span>Sort & Filters</span>
							</button>
						</div>

						<div className={`filter-wrapper ${showMobileFilters && "active"}`}>
							<span className="filter-title">Sort and Filters</span>
							<BusSortBy
								handleSortByChange={handleSortByChange}
								sortBy={sortBy}
								setSortBy={setSortBy}
							/>
							<LeftFilter
								sourceCity={fromLocation}
								destinationCity={toLocation}
								doj={selectedDate}
								onFilterChange={handleFilter}
								key={"mobile-left-filter"}
							/>
						</div>
					</div>
					{/*          <div className="dates">
            {dates.map((date) => (
              <p
                key={date}
                className={`date ${date === selectedDate ? "active" : ""}`}
                onClick={() => handleDateFilter(date)}
              >
                {date.replace(/,/g, ", ")}
              </p>
            ))}
          </div>*/}
					{/* <div className="exclusiveOffers">
            <Title title={"Offers"} />
            <div className="offers">
              <OffersCard
                img={offer1}
                title={"Deal of the Day"}
                subtitle={"Enjoy Different  Deals Each Day With "}
                code={"EASEDAY"}
                date={"31st july, 2023"}
              />
              <OffersCard
                img={offer1}
                title={"Deal of the Day"}
                subtitle={"Enjoy Different  Deals Each Day With "}
                code={"EASEDAY"}
                date={"31st july, 2023"}
              />
              <OffersCard
                img={offer1}
                title={"Deal of the Day"}
                subtitle={"Enjoy Different  Deals Each Day With "}
                code={"EASEDAY"}
                date={"31st july, 2023"}
              />
            </div>
          </div> */}
					<Spin spinning={loading}>
						<div className="hadder">
							<div className="hadder-top">
								<div className="back-arrow">
									<img
										src={leftArrow}
										alt="back arrow"
										onClick={() =>
											navigate(`/?from=${fromLocation}&to=${toLocation}`)
										}
									/>
								</div>
								{/* Bus route title */}
								<RoutesTitle
									locationOne={fromLocation}
									locationTwo={toLocation}
									date={selectedDate}
									onDateChange={handleDate}
								/>
							</div>
							{/* No of buses */}
							<ColumnNames
								noOfBuses={
									// noOfBuses +
									noOfVrlBuses + noOfSrsBuses
								}
							/>
							{/* dates filter */}
							<div className="dates">
								{dates.map((date) => (
									<p
										key={date}
										className={`date ${date === selectedDate ? "active" : ""}`}
										onClick={() => handleDateFilter(date)}
									>
										{date.replace(/,/g, ", ")}
									</p>
								))}
							</div>
						</div>
						<div className="wrapper">
							{/* Render Bus list */}
							{sortedBusList?.map((bus) => {
								const isVrl = bus.type === "vrl" ? true : false;

								const busProps = getBusBookingCardProps(
									bus,
									fromLocation,
									toLocation,
									selectedDate
								);

								return (
									<div
										className="bus-card-container"
										key={isVrl ? bus?.ReferenceNumber : bus.id}
									>
										<BusBookingCard {...busProps} key={bus?.ReferenceNumber} />
									</div>
								);
							})}

							{/* vrl buses */}
							{/* {vrlBuses?.map((bus) => (
                <div className="bus-card-container" key={bus?.ReferenceNumber}>
                  <BusBookingCard
                    key={bus?.ReferenceNumber}
                    ReferenceNumber={bus?.ReferenceNumber}
                    // inventoryType={bus.inventoryType}
                    sourceCity={fromLocation}
                    sourceCityId={bus?.FromCityId}
                    destinationCity={toLocation}
                    destinationCityId={bus?.ToCityId}
                    doj={selectedDate}
                    title={"VRL Travels"}
                    busName={"VRL Travels"}
                    busType={bus?.BusTypeName}
                    rating={(Math.random() * 1 + 4).toFixed(1)}
                    noOfReviews={Math.floor(Math.random() * 101) + 37}
                    pickUpLocation={bus?.FromCityName}
                    pickUpTime={bus?.CityTime}
                    reachLocation={bus?.ToCityName}
                    reachTime={bus?.ArrivalTime}
                    // calucalte total time
                    travelTime={calculateVrlTravelTime(
                      bus?.CityTime24,
                      bus?.ApproxArrival
                    )}
                    seatsLeft={bus?.EmptySeats}
                    // avlWindowSeats={bus?.avlWindowSeats}
                    price={bus?.lowestPrice}
                    allPrices={bus?.allPrices}
                    // pickUpTimes={pickUpTimes}
                    pickUpLocationOne={bus?.BoardingPoints}
                    // pickUpLocationTwo={pickUpLocationTwo}
                    // dropTimes={dropTimes}
                    dropLocationOne={bus?.DroppingPoints}
                    // dropLocationTwo={dropLocationTwo}
                    backSeat={true}
                    // cancellationPolicy={bus?.cancellationPolicy}
                    fare={bus?.fares}
                    isVrl={true}
                  />
                </div>
              ))} */}

							{/* srs buses */}
							{/* {srsBuses?.map((bus) => (
                <div className="bus-card-container" key={bus?.id}>
                  <BusBookingCard
                    key={bus?.id}
                    scheduleId={bus?.id}
                    // inventoryType={bus.inventoryType}
                    sourceCity={fromLocation}
                    sourceCityId={bus?.origin_id}
                    destinationCity={toLocation}
                    destinationCityId={bus?.destination_id}
                    doj={selectedDate}
                    title={bus?.operator_service_name}
                    busName={bus?.operator_service_name}
                    busType={bus?.bus_type}
                    rating={(Math.random() * 1 + 4).toFixed(1)}
                    noOfReviews={Math.floor(Math.random() * 101) + 37}
                    pickUpLocation={fromLocation}
                    pickUpTime={bus?.dep_time}
                    reachLocation={toLocation}
                    reachTime={bus?.arr_time}
                    // calucalte total time
                    travelTime={bus?.duration}
                    seatsLeft={bus?.available_seats}
                    // avlWindowSeats={bus?.avlWindowSeats}
                    price={priceToDisplaySrs(bus?.show_fare_screen)}
                    // pickUpTimes={pickUpTimes}
                    pickUpLocationOne={bus?.boarding_stages}
                    // pickUpLocationTwo={pickUpLocationTwo}
                    // dropTimes={dropTimes}
                    dropLocationOne={bus?.dropoff_stages}
                    // dropLocationTwo={dropLocationTwo}
                    backSeat={true}
                    // cancellationPolicy={bus?.cancellationPolicy}
                    fare={bus?.show_fare_screen}
                    isSrs={true}
                  />
                </div>
              ))} */}

							{/* seat seller buses */}
							{busDetails?.map((bus, index) => (
								<div className="bus-card-container" key={index}>
									<BusBookingCard
										key={index}
										tripId={bus?.id}
										// inventoryType={bus.inventoryType}
										sourceCity={fromLocation}
										sourceCityId={bus?.source}
										destinationCity={toLocation}
										destinationCityId={bus?.destination}
										doj={selectedDate}
										title={bus?.travels}
										busName={bus?.travels}
										busType={bus?.busType}
										rating={(Math.random() * 1 + 4).toFixed(1)}
										noOfReviews={Math.floor(Math.random() * 101) + 37}
										pickUpLocation={fromLocation}
										pickUpTime={convertMinutesToTime(bus?.departureTime)}
										reachLocation={toLocation}
										reachTime={convertMinutesToTime(bus?.arrivalTime)}
										travelTime={calculateTravelTime(
											bus?.departureTime,
											bus?.arrivalTime
										)}
										seatsLeft={bus?.availableSeats}
										avlWindowSeats={bus?.avlWindowSeats}
										price={priceToDisplay(bus?.fareDetails)}
										// pickUpTimes={pickUpTimes}
										pickUpLocationOne={
											Array.isArray(bus?.boardingTimes)
												? bus?.boardingTimes
												: [bus?.boardingTimes]
										}
										// pickUpLocationTwo={pickUpLocationTwo}
										// dropTimes={dropTimes}
										dropLocationOne={
											Array.isArray(bus?.droppingTimes)
												? bus?.droppingTimes
												: [bus?.droppingTimes]
										}
										// dropLocationTwo={dropLocationTwo}
										backSeat={true}
										cancellationPolicy={bus?.cancellationPolicy}
										fare={bus?.fareDetails}
									/>
								</div>
							))}
						</div>
					</Spin>
				</div>
			</div>
		</div>
	);
};

export default BusBooking;
