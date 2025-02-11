import React from 'dom-chef';
import select from 'select-dom';
import {checkInline} from '../libs/icons';
import features from '../libs/features';
import {fetchCIStatus} from './ci-link';

function populateDropDown({currentTarget}: Event): void {
	const searchParam = new URLSearchParams(location.search);
	let queryString = searchParam.get('q') || '';

	const [, currentStatus = ''] = queryString.match(/\bstatus:(success|failure|pending)\b/) || [];

	if (currentStatus) {
		queryString = queryString.replace(`status:${currentStatus}`, '').trim();
	}

	const dropdown = select('.select-menu-list', currentTarget as Element)!;
	for (const status of ['Success', 'Failure', 'Pending']) {
		const isSelected = currentStatus.toLowerCase() === status.toLowerCase();
		const search = new URLSearchParams({
			q: `${queryString} status:${status.toLowerCase()}`
		});

		dropdown.append(
			<a
				href={`?${search}`}
				className={`select-menu-item ${isSelected ? 'selected' : ''}`}
				aria-checked={isSelected}
				role="menuitemradio"
			>
				{checkInline()}
				<div className="select-menu-item-text">{status}</div>
			</a>
		);
	}
}

async function init(): Promise<void | false> {
	const hasCI = await fetchCIStatus();

	if (!hasCI) {
		return false;
	}

	const reviewsFilter = select('.table-list-header-toggle > details:nth-last-child(3)')!;

	if (!reviewsFilter) {
		return false;
	}

	// Copy existing element and adapt its content
	const statusFilter = reviewsFilter.cloneNode(true) as HTMLDetailsElement;
	select('summary', statusFilter)!.textContent = 'Status\u00A0';
	select('.select-menu-title', statusFilter)!.textContent = 'Filter by build status';
	select('.select-menu-list', statusFilter)!.textContent = ''; // Drop previous filters

	statusFilter.addEventListener('toggle', populateDropDown, {once: true});
	reviewsFilter.after(statusFilter);
}

features.add({
	id: 'filter-pr-by-build-status',
	description: 'Filter pull requests by their build status (success, failure, and pending)',
	include: [
		features.isPRList
	],
	load: features.onAjaxedPages,
	init
});
