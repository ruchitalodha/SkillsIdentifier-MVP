import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController, IonicPage, ModalController } from 'ionic-angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { HomePage } from '../../pages/home/home';
import { JobDataProvider } from '../../providers/job-data/job-data';
import { FootbarComponent } from '../../components/footbar/footbar';
import { jobInformation, skillInformation } from '../../assets/data/dataModel';


@IonicPage({
	name: "skills",
	segment: "skills"
})
@Component({
  selector: 'page-skills',
  templateUrl: 'skills.html'
})

export class SkillsPage {

	preview: any;

	currentJob = [ {'title': '', 'uuid': '', 'parent_uuid': ''},  {'title': '', 'uuid': '', 'parent_uuid': ''}, {'title': '', 'uuid': '', 'parent_uuid': ''}, {'title': '', 'uuid': '', 'parent_uuid': ''}, {'title': '', 'uuid': '', 'parent_uuid': ''}, {'title': '', 'uuid': '', 'parent_uuid': ''} ];
	dreamJob = {'title': '', 'uuid': '', 'parent_uuid': ''};

	skillsRequired: skillInformation[] = [];
	skillsRequiredTitles: string[] = [];
	abilitiesRequired: skillInformation[] = [];
	knowledgeRequired: skillInformation[] = [];

	skillsPossessed: any = [[], [], [], []];

	skillsSelected: skillInformation[] = [];
	skillsSelectedLength: number = 0;
	skillsNeededLength: number;
  // resume lines need to be stored as objects; there are issues with strings being a primitive.
	resumeTemplate: any = [];
	resumeIntro: string = "<Enter your full name here>\n<Enter your phone number here>\n<Enter your email here>"

	emailForm: FormGroup;
	emailAddress: string = '';

	loading = this._loadingCtrl.create({
			spinner: 'dots'
		})

	constructor(public navCtrl: NavController,
				private _loadingCtrl: LoadingController,
				private _alertCtrl: AlertController,
				public navParams: NavParams,
				private _jobDataProvider: JobDataProvider,
				private _modalCtrl: ModalController) {

		this.currentJob = this._jobDataProvider.currentJob;
		this.dreamJob   = this._jobDataProvider.dreamJob;

		// this.openModal();
	}

	ngOnInit(){
		this.loading.present();
		if (this.dreamJob.title != '') {

			this.identifyRequiredSkills()

			this.loading.dismiss();

		}  else {
			this.loading.dismiss();
			this.navCtrl.push("home")
		}
		// console.log("skills required:", this.skillsRequired)
		// console.log("skills possessed:", this.skillsPossessed)
	}

	ngOnDestroy(){
		this.loading.dismiss();
	}

	popView(){
		this.navCtrl.pop();
	}

	// gets the most important skills for the target job from the Data@Work API
	identifyRequiredSkills() {
		// get skills for the target (dream) job and record the top ten skills
		this._jobDataProvider.getSkillset(this.dreamJob.uuid)
						.subscribe(res => {
							console.log(res);
							this.skillsRequired = [];
							let j = 0;
							let i = 0;
							while ( j < 10 && i < 100 ) {
								if (res.skills[i].skill_type == "skill") {
									this.skillsRequired.push(res.skills[i])
									this.skillsRequiredTitles.push(res.skills[i].skill_name)
									j++;
								}
								i++;
							}
							this.identifyRelevantSkills()
						})
	}

	// reviews the skills for each past job using the Data@Work API and identifies
	//  skills that are relevant to the target job
	identifyRelevantSkills() {
		console.log(this.skillsRequired)
		console.log("CURRENT JOB", this.currentJob);
		// get skills for each past job and record the top 5 for each in the "skillsPossessed" array

		this.currentJob.forEach((job, index) =>{

			if (job.title != '') {
				console.log("Index = " + index)
				this._jobDataProvider.getSkillset(job.uuid)
					.subscribe(res => {
						console.log("skill response for " + job.title);
						console.log(res);
						// this.skillsPossessed[index] = [];
						var k = 0;
						var max = 3;
						// include only skills that are also relevant for the target job
						for (var i = 0; i < 30; i++) {
							if (k < max && this.skillsRequiredTitles.includes(res.skills[i].skill_name)) {
								this.skillsPossessed[index].push(res.skills[i]);
								console.log("ADDED: " + res.skills[i].skill_name);
								k++;
							} else if (k < max) {
								console.log("NOT REQUIRED: " + res.skills[i].skill_name)
							}
						}
						// if we found any relevant skills for this job, include it in the resume
						if (k > 0) {
							this.createResumeEntry(index)
						}
				})
			}
		})

	}

	createResumeEntry(idx: number) {
		let index = idx;
		let job = this.currentJob[index];
		if (this.skillsPossessed[index] != []) {
			this.resumeTemplate[index] = { value: job.title + "\n" };
			for (let skill of this.skillsPossessed[index]) {
				this.resumeTemplate[index].value = this.resumeTemplate[index].value + '- ' + skill.skill_name + "\n";
			}
		}
		console.log(this.resumeTemplate[index].value)

	}

	// copy the resume to the clipboard
	copyResume(){
	    let selBox = document.createElement('textarea');
	    selBox.style.position = 'fixed';
	    selBox.style.left = '0';
	    selBox.style.top = '0';
	    selBox.style.opacity = '0';

	    let fullResume = this.resumeIntro + "\n\n";
	    for (let entry of this.resumeTemplate) {
	    	fullResume = fullResume + entry.value + "\n";
	    }
	    selBox.value = fullResume;
	    document.body.appendChild(selBox);
	    selBox.focus();
	    selBox.select();
	    document.execCommand('copy');
	    document.body.removeChild(selBox);

	    this.presentAlert();

  	}

  	presentAlert() {
	  let alert = this._alertCtrl.create({
	    title: 'Congratulations!',
	    subTitle: 'Your new resume is copied',
	    buttons: ['Dismiss']
	  });
	  console.log("alert")
	  alert.present();
	}

	// emails the edited resume to the user
	// sendEmail() {
	// 	let fullResume = ''
	// 	for (let entry of this.resumeTemplate) {
	// 		fullResume = fullResume + entry + '\n';
	// 	}
	// 	let email = {
	// 	to: this.emailAddress,
	// 	cc: '',
	// 	bcc: '',
	// 	attachments: [

	// 	],
	// 	subject: 'Your SkillsIdentifier Resume Template',
	// 	body: fullResume,
	// 	isHtml: true
	// 	};

	// 	// this.emailComposer.isAvailable().then((available: boolean) =>{
	// 	// 	if(available) {
	// 	// 	//Now we know we can send
	// 	// 	}
	// 	// });

	// 	console.log(this.emailAddress)
	// 	console.log(fullResume)
	// }

	// sets up the pdf resume
	// downloadPdf(){

	// 	let lines = []
	// 	console.log(this.skillsRequired);
	// 	lines.push("The six most important skills for " + this.dreamJob.title + " are:");
	// 	for (var i = 0; i < 6; i++) {
	// 		lines.push(this.skillsRequired[i].skill_name);
	// 	}
	// 	lines.push("");
	// 	for (let index in this.currentJob) {
	// 		let job = this.currentJob[index];
	// 		lines.push(job.title)
	// 		for (let skill of this.skillsPossessed[index]) {
	// 			lines.push(skill.skill_name + ": " + skill.description);
	// 		}
	// 	}

	// 	this.resume.text(lines, 10, 10);

	// 	this.resume.save("resume.pdf");

	// 	// this.resume.output('datauri')
	// 	// console.log(this.preview)

	// 	// let iframe = document.getElementById("pdfPreview")
	// 	// console.log(iframe);

	// 	// iframe.attr('src', this.resume.output('datauri'));
	// }
}
