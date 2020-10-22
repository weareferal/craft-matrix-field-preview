<?php


namespace weareferal\matrixfieldpreview\controllers;

use weareferal\matrixfieldpreview\MatrixFieldPreview;
use weareferal\matrixfieldpreview\assets\previewsettings\PreviewSettingsAsset;
use weareferal\matrixfieldpreview\assets\previewimage\PreviewImageAsset;

use Craft;
use craft\web\Controller;


class SettingsController extends Controller
{

    protected $allowAnonymous = [];

    /**
     * General plugin settings
     */
    public function actionGeneral()
    {
        $plugin = MatrixFieldPreview::getInstance();
        $settings = $plugin->getSettings();

        return $this->renderTemplate('matrix-field-preview/settings/general', [
            'settings' => $settings,
            'plugin' => $plugin
        ]);
    }

    /**
     * Enable/disable previews on matrix fields
     */
    public function actionFields()
    {
        $plugin = MatrixFieldPreview::getInstance();
        $settings = $plugin->getSettings();

        return $this->renderTemplate('matrix-field-preview/settings/fields', [
            'settings' => $settings,
            'plugin' => $plugin
        ]);
    }

    /**
     * Add images and descriptions to individual matrix field block types
     */
    public function actionPreviews()
    {
        $plugin = MatrixFieldPreview::getInstance();
        $settings = $plugin->getSettings();

        $this->view->registerAssetBundle(PreviewSettingsAsset::class);

        $assets = [
            'success' => Craft::$app->getAssetManager()->getPublishedUrl('@app/web/assets/cp/dist', true, 'images/success.png')
        ];

        $blockTypes = Craft::$app->matrix->getAllBlockTypes();
        $previews = $plugin->previewService->getAll();

        $previewsMap = [];
        foreach ($previews as $preview) {
            $previewsMap[$preview->blockType->id] = $preview;
        }

        $matrixFieldsMap = [];
        foreach ($blockTypes as $blockType) {
            $matrixField = $blockType->field;

            // Initialise an array for each matrix field
            if (!array_key_exists($matrixField->id, $matrixFieldsMap)) {
                $matrixFieldsMap[$matrixField->id] = [
                    'matrixField' => $matrixField,
                    'rows' => []
                ];
            }

            // Get the preview for this block type if it exists
            $preview = null;
            if (array_key_exists($blockType->id, $previewsMap)) {
                $preview = $previewsMap[$blockType->id];
            }

            array_push($matrixFieldsMap[$matrixField->id]['rows'], [
                'blockType' => $blockType,
                'preview' => $preview
            ]);
        }

        $matrixFields = [];
        foreach ($matrixFieldsMap as $key => $value) {
            array_push($matrixFields, $value);
        }

        return $this->renderTemplate('matrix-field-preview/settings/previews', [
            'settings' => $settings,
            'plugin' => $plugin,
            'assets' => $assets,
            'matrixFields' => $matrixFields
        ]);
    }

    /**
     * Configure an individual matrix field block type preview. Upload an
     * image and a custom description
     */
    public function actionPreview($blockTypeId)
    {
        $this->view->registerAssetBundle(PreviewImageAsset::class);

        $siteId = Craft::$app->getSites()->currentSite->id;
        $previewService = MatrixFieldPreview::getInstance()->previewService;
        $request = Craft::$app->request;
        $plugin = MatrixFieldPreview::getInstance();
        $settings = $plugin->getSettings();

        $blockType = Craft::$app->matrix->getBlockTypeById($blockTypeId);
        if (!$blockType) {
            throw new NotFoundHttpException('Invalid matrix block type ID: ' . $blockTypeId);
        }

        $preview = $previewService->getByBlockTypeId($blockTypeId);
        if (!$preview) {
            $preview = new PreviewRecord();
            $preview->blockTypeId = $blockType->id ?? null;
            $preview->siteId = $siteId;
            $preview->description = "";
            $preview->matrixFieldHandle = $blockType->field->handle;
            $preview->save();
        }

        if ($request->isPost) {
            $post = $request->post();
            $preview->description = $post['description'];
            if ($preview->validate()) {
                $preview->save();
                Craft::$app->getSession()->setNotice(Craft::t('app', 'Plugin settings saved.'));
                return $this->redirect('/admin/settings/plugins/' . $plugin->id);
            } else {
                Craft::$app->getSession()->setError(Craft::t('app', 'Couldn’t save plugin settings.'));
            }
        }

        return $this->renderTemplate(
            'matrix-field-preview/settings/preview',
            [
                'preview' => $preview,
                'plugin' => $plugin,
                'fullPageForm' => true,
                'settings' => $settings
            ]
        );
    }
}