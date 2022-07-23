import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { Client as EvernoteClient } from 'evernote';
import axios from 'axios';
import { BrowserWindow } from "@electron/remote";


interface EvernoteMigrationPluginSettings {
	consumerKey: string;
  consumerSecret: string;
}

const DEFAULT_SETTINGS: EvernoteMigrationPluginSettings = {
	consumerKey: '',
  consumerSecret: ''
}

export default class EvernoteMigrationPlugin extends Plugin {
	settings: EvernoteMigrationPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new ModalWindow(this.app, this.settings).open();
			}
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new ModalWindow(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new EvernoteMigrationSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ModalWindow extends Modal {
  settings: EvernoteMigrationPluginSettings;

	constructor(app: App, settings: EvernoteMigrationPluginSettings) {
		super(app);
    this.settings = settings;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!!!');

		new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Evernote Auth")
        .setCta()
        .onClick(() => {
          //var callbackUrl = "obsidian://";
          var callbackUrl = "http://localhost/callback";

          var evernoteClient = new EvernoteClient({
            consumerKey: this.settings.consumerKey,
            consumerSecret: this.settings.consumerSecret,
            sandbox: true,
            china: false,
          });

          var myOauthToken: string;
          var myOauthTokenSecret: string;
          evernoteClient.getRequestToken(callbackUrl, (error: any, oauthToken: string, oauthTokenSecret: string) => {
            if (error) {
              console.log('getRequestToken() failed');
            }
            // store your token here somewhere - for this example we use req.session
            myOauthToken = oauthToken;
            myOauthTokenSecret = oauthTokenSecret;


            const url = evernoteClient.getAuthorizeUrl(oauthToken);
            console.log('browse to ' + url);


            const window = new BrowserWindow({
						  width: 600,
						  height: 800,
						  webPreferences: {
						    nodeIntegration: false, // We recommend disabling nodeIntegration for security.
						    contextIsolation: true, // We recommend enabling contextIsolation for security.
						    // see https://github.com/electron/electron/blob/master/docs/tutorial/security.md
						  },
						});

						window.loadURL(url);

            //const {data, status} =  axios.post(evernoteClient.getAuthorizeUrl(oauthToken)	);
            //.redirect(client.getAuthorizeUrl(oauthToken)); // send the user to Evernote
            
          });


          console.log('clicked by evernote migration plugin');
        })
    );
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class EvernoteMigrationSettingTab extends PluginSettingTab {
	plugin: EvernoteMigrationPlugin;

	constructor(app: App, plugin: EvernoteMigrationPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Evernote Migraion Plugin Settings'});

    new Setting(containerEl).setName('OAuth').setHeading();

		new Setting(containerEl)
			.setName('Oauth Consumer Key')
			.setDesc('This key was created by evernote')
			.addText(text => text
				.setPlaceholder('Enter your Consumer Key')
				.setValue(this.plugin.settings.consumerKey)
				.onChange(async (value) => {
					this.plugin.settings.consumerKey = value;
					await this.plugin.saveSettings();
				}));

    new Setting(containerEl)
      .setName('Oauth Consumer Secret')
      .setDesc('It\'s a secret')
      .addText(text => text
        .setPlaceholder('Enter your Consumer Secret')
        .setValue(this.plugin.settings.consumerSecret)
        .onChange(async (value) => {
          this.plugin.settings.consumerSecret = value;
          await this.plugin.saveSettings();
        }));
	}
}
